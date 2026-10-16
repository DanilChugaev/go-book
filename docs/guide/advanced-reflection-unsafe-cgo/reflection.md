---
prev: /guide/advanced-reflection-unsafe-cgo/README.md
next: /guide/advanced-reflection-unsafe-cgo/unsafe.md
---

# Reflection: `reflect.Type` и `reflect.Value`

## Что отражает пакет `reflect`

В обычном Go компилятор знает тип заранее:

```go
func taskTitle(task Task) string {
	return task.Title
}
```

Reflection нужен, когда библиотека получает `any` и должна исследовать неизвестный до запуска конкретный тип. Две основные точки входа:

```go
value := Task{ID: 1, Title: "Купить молоко", Priority: 2}

typ := reflect.TypeOf(value)
reflectedValue := reflect.ValueOf(value)

fmt.Println(typ.Name())           // Task
fmt.Println(typ.Kind())           // struct
fmt.Println(reflectedValue.Kind()) // struct
```

- `reflect.Type` описывает тип: имя, `Kind`, поля, методы, теги;
- `reflect.Value` представляет конкретное значение: его можно читать, а в ограниченных условиях — менять или вызывать методы.

`Kind` — широкая категория (`struct`, `slice`, `map`, `ptr`, `string`), а не точный named type. У `Task`, `CreateTaskRequest` и любой другой struct будет `Kind() == reflect.Struct`; для различения конкретного типа используйте сам `Type` или явный type switch.

## Сначала type switch, потом reflection

Если число вариантов известно, type switch безопаснее и понятнее:

```go
func taskID(value any) (TaskID, bool) {
	switch current := value.(type) {
	case Task:
		return current.ID, true
	case *Task:
		if current == nil {
			return 0, false
		}
		return current.ID, true
	default:
		return 0, false
	}
}
```

Reflection оправдан, когда набор структур действительно открыт: библиотека metadata, serializer, framework integration. Не заменяйте type switch reflection только ради «универсальности» для двух известных типов.

## Инспекция структуры

`Type.NumField` и `Type.Field` позволяют библиотеке обойти поля struct. Сначала проверьте `Kind`, иначе `NumField` вызовет panic:

```go
func exportedFieldNames(value any) ([]string, error) {
	typ := reflect.TypeOf(value)
	if typ == nil {
		return nil, errors.New("значение не должно быть nil")
	}

	if typ.Kind() == reflect.Ptr {
		typ = typ.Elem()
	}
	if typ.Kind() != reflect.Struct {
		return nil, fmt.Errorf("ожидалась структура, получен %s", typ.Kind())
	}

	names := make([]string, 0, typ.NumField())
	for index := 0; index < typ.NumField(); index++ {
		field := typ.Field(index)
		if field.PkgPath != "" {
			continue // Неэкспортируемое поле.
		}
		names = append(names, field.Name)
	}
	return names, nil
}
```

Для поля `reflect.StructField.PkgPath == ""` означает, что оно экспортируемо. Это важно для библиотек, похожих на JSON encoder: private поля не часть внешнего contract и reflection не должен обходить правила видимости через unsafe.

## Struct tags

Тег — строка metadata рядом с объявлением поля. `encoding/json` интерпретирует тег `json`, но пакет `reflect` только возвращает текст:

```go
type TaskDTO struct {
	ID       int64  `json:"id" db:"id"`
	Title    string `json:"title" db:"title"`
	Internal string `json:"-"`
}

func jsonFieldName(field reflect.StructField) (string, bool) {
	tag := field.Tag.Get("json")
	if tag == "-" {
		return "", false
	}

	name, _, _ := strings.Cut(tag, ",")
	if name == "" {
		return field.Name, true
	}
	return name, true
}
```

`StructTag.Get` возвращает пустую строку и для отсутствующего тега, и для тега с пустым значением. Если это различие важно, используйте `Lookup`:

```go
raw, exists := field.Tag.Lookup("json")
```

Не пишите свой JSON encoder, SQL mapper или validator только потому, что tags доступны. Форматы, embedded fields, `omitempty`, pointers, custom marshalers, time и null semantics быстро делают простой reflection-код неполной и хрупкой копией зрелой библиотеки.

## `reflect.Value`: чтение и nil

`reflect.ValueOf(nil)` возвращает invalid Value. Методы вроде `Kind` на invalid value допустимы и вернут `Invalid`, но `Interface`, `Elem` и многие другие операции могут вызвать panic. Проверяйте `IsValid`:

```go
func describe(value any) string {
	reflected := reflect.ValueOf(value)
	if !reflected.IsValid() {
		return "<nil>"
	}

	return reflected.Type().String()
}
```

Nil pointer и nil interface — разные ситуации:

```go
var task *Task
var value any = task

reflected := reflect.ValueOf(value)
fmt.Println(reflected.Kind())  // ptr
fmt.Println(reflected.IsNil()) // true
```

`IsNil` разрешён только для подходящих Kind (`chan`, `func`, `map`, `pointer`, `interface`, `slice`). Вызов `IsNil` у struct или int вызовет panic. Поэтому reflection-код должен сначала проверять `Kind`.

## Изменение значений: addressable и `CanSet`

Значение, переданное в `reflect.ValueOf`, обычно является копией и не settable:

```go
task := Task{Title: "Купить молоко"}
value := reflect.ValueOf(task)

field := value.FieldByName("Title")
fmt.Println(field.CanSet()) // false
// field.SetString("Купить продукты") // panic
```

Чтобы менять исходную структуру, передайте non-nil pointer, вызовите `Elem` и проверьте всё до `Set`:

```go
func setExportedString(target any, fieldName, newValue string) error {
	value := reflect.ValueOf(target)
	if !value.IsValid() || value.Kind() != reflect.Ptr || value.IsNil() {
		return errors.New("target должен быть non-nil указателем на структуру")
	}

	value = value.Elem()
	if value.Kind() != reflect.Struct {
		return errors.New("target должен указывать на структуру")
	}

	field := value.FieldByName(fieldName)
	if !field.IsValid() {
		return fmt.Errorf("поле %q не найдено", fieldName)
	}
	if field.Kind() != reflect.String || !field.CanSet() {
		return fmt.Errorf("поле %q должно быть доступной строкой", fieldName)
	}

	field.SetString(newValue)
	return nil
}
```

Этот helper учебный. В Task Manager явное `task.Title = newValue` лучше: имя поля проверяется компилятором, IDE находит usages, а рефакторинг не ломает строку `"Title"` во время запуска.

## Методы через reflection

`Value.MethodByName` и `Call` позволяют вызвать метод по строке, но теряют проверку сигнатуры при компиляции:

```go
method := reflect.ValueOf(task).MethodByName("Summary")
if !method.IsValid() {
	return errors.New("метод Summary не найден")
}

results := method.Call(nil)
summary, ok := results[0].Interface().(string)
if !ok {
	return errors.New("Summary должен вернуть string")
}
```

Неверное число аргументов, неправильный тип или вызов метода, который panics, тоже могут закончиться panic. Если API требует `Summary() string`, определите маленький интерфейс и вызовите метод напрямую. Reflection method call оставьте для framework/extension boundary с документированным динамическим contract.

## Производительность и cache metadata

Reflection медленнее прямого доступа, но реальная стоимость зависит от сценария. В serializer/ORM повторный обход `Type` и tags для каждой записи может стать заметным. Библиотеки часто кэшируют metadata по `reflect.Type`:

```go
type fieldMetadata struct {
	index int
	name  string
}

var metadataCache sync.Map // map[reflect.Type][]fieldMetadata
```

Такой cache сам создаёт ответственность: concurrency safety, bounded growth, корректность embedded fields и тесты. Не добавляйте его до profile. Для application-кода обычно выгоднее вообще не писать reflection loop и использовать `encoding/json`, конкретный mapper или generated code.

## Проверяйте dynamic contract тестами

Для reflection-helper тестируйте минимум:

- ожидаемую структуру и exported/private поля;
- non-struct input;
- `nil` interface и typed nil pointer;
- отсутствующее поле, неверный Kind и невозможность `Set`;
- теги `json:"-"`, пустое имя и опции;
- изменения после rename поля, если строковые имена являются частью API.

Нижний слой с reflection должен возвращать обычный `error` для неправильной формы, а не полагаться на `recover` как на регулярную валидацию. Следующая страница покажет инструмент, который может вообще обойти эти проверки, — `unsafe`.
