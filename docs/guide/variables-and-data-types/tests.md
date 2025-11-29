# Тестирование

<QuizContainer :questions />

<script setup>
const questions = [
    {
        text: 'Что такое переменная в Go?',
        options: [
            {
                text: 'Функция для выполнения кода',
            },
            {
                text: 'Именованное место в памяти для хранения значения',
                correct: true,
            },
            {
                text: 'Тип данных для коллекций',
            },
            {
                text: 'Ключевое слово для циклов',
            },
        ]
    },
    {
        text: 'Какой способ объявления переменной используется только внутри функций?',
        options: [
            {
                text: 'var name type = value',
            },
            {
                text: 'name := value',
                correct: true,
            },
            {
                text: 'const name = value',
            },
            {
                text: 'type name struct {}',
            },
        ]
    },
    {
        text: 'Что получает переменная, объявленная без инициализации?',
        options: [
            {
                text: 'Случайное значение из памяти',
            },
            {
                text: 'Нулевое значение (zero value) своего типа',
                correct: true,
            },
            {
                text: 'Nil для всех типов',
            },
            {
                text: 'Ошибка компиляции',
            },
        ]
    },
    {
        text: 'Какое нулевое значение для типа bool?',
        options: [
            {
                text: 'true',
            },
            {
                text: 'false',
                correct: true,
            },
            {
                text: '0',
            },
            {
                text: 'nil',
            },
        ]
    },
    {
        text: 'Какое нулевое значение для типа string?',
        options: [
            {
                text: 'nil',
            },
            {
                text: '"" (пустая строка)',
                correct: true,
            },
            {
                text: '0',
            },
            {
                text: 'false',
            },
        ]
    },
    {
        text: 'Какой тип является псевдонимом для uint8?',
        options: [
            {
                text: 'rune',
            },
            {
                text: 'byte',
                correct: true,
            },
            {
                text: 'int',
            },
            {
                text: 'float32',
            },
        ]
    },
    {
        text: 'Какой тип используется для представления одного Unicode-символа?',
        options: [
            {
                text: 'byte',
            },
            {
                text: 'rune',
                correct: true,
            },
            {
                text: 'string',
            },
            {
                text: 'int8',
            },
        ]
    },
    {
        text: 'Какой диапазон значений у типа int8?',
        options: [
            {
                text: '0..255',
            },
            {
                text: '-128..127',
                correct: true,
            },
            {
                text: '-32768..32767',
            },
            {
                text: '0..65535',
            },
        ]
    },
    {
        text: 'Какой тип по умолчанию используется для дробных чисел в коротком объявлении, например pi := 3.14?',
        options: [
            {
                text: 'float32',
            },
            {
                text: 'float64',
                correct: true,
            },
            {
                text: 'int',
            },
            {
                text: 'complex64',
            },
        ]
    },
    {
        text: 'Можно ли изменить отдельный символ в строке, например s[0] = \'A\'?',
        options: [
            {
                text: 'Да, строки mutable',
            },
            {
                text: 'Нет, строки immutable',
                correct: true,
            },
            {
                text: 'Только если строка пустая',
            },
            {
                text: 'Только для ASCII',
            },
        ]
    },
    {
        text: 'Что возвращает len(s) для строки s в Go?',
        options: [
            {
                text: 'Количество символов (рун)',
            },
            {
                text: 'Количество байтов',
                correct: true,
            },
            {
                text: 'Количество слов',
            },
            {
                text: '0, если строка пустая',
            },
        ]
    },
    {
        text: 'Как правильно посчитать количество символов в строке с не-ASCII, например "Привет"?',
        options: [
            {
                text: 'len(s)',
            },
            {
                text: 'len([]rune(s))',
                correct: true,
            },
            {
                text: 'len([]byte(s))',
            },
            {
                text: 'utf8.Len(s)',
            },
        ]
    },
    {
        text: 'Как преобразовать int в float64?',
        options: [
            {
                text: 'Просто присвоить: var f float64 = i',
            },
            {
                text: 'float64(i)',
                correct: true,
            },
            {
                text: 'i.(float64)',
            },
            {
                text: 'strconv.Itoa(i)',
            },
        ]
    },
    {
        text: 'Что происходит при преобразовании float64 в int, например int(3.99)?',
        options: [
            {
                text: 'Округляет до 4',
            },
            {
                text: 'Отбрасывает дробную часть: 3',
                correct: true,
            },
            {
                text: 'Ошибка компиляции',
            },
            {
                text: 'Паника в runtime',
            },
        ]
    },
    {
        text: 'Как объявить константу?',
        options: [
            {
                text: 'var Pi = 3.14',
            },
            {
                text: 'const Pi = 3.14',
                correct: true,
            },
            {
                text: 'Pi := 3.14',
            },
            {
                text: 'type Pi float64 = 3.14',
            },
        ]
    },
    {
        text: 'Что такое iota в константах?',
        options: [
            {
                text: 'Случайное число',
            },
            {
                text: 'Автоинкремент для последовательных констант',
                correct: true,
            },
            {
                text: 'Тип для комплексных чисел',
            },
            {
                text: 'Функция для итерации',
            },
        ]
    },
    {
        text: 'Какое имя переменной является экспортируемым (visible вне пакета)?',
        options: [
            {
                text: 'userName',
            },
            {
                text: 'UserName',
                correct: true,
            },
            {
                text: '_userName',
            },
            {
                text: '1userName',
            },
        ]
    },
    {
        text: 'Можно ли использовать ключевое слово "if" как имя переменной?',
        options: [
            {
                text: 'Да, если в верхнем регистре',
            },
            {
                text: 'Нет, это reserved keyword',
                correct: true,
            },
            {
                text: 'Только в функциях',
            },
            {
                text: 'Только для констант',
            },
        ]
    },
    {
        text: 'Как объявить несколько переменных одного типа через запятую?',
        options: [
            {
                text: 'var a b int = 1, 2',
            },
            {
                text: 'var a, b int = 1, 2',
                correct: true,
            },
            {
                text: 'a, b := 1 2',
            },
            {
                text: 'const a, b = 1, 2',
            },
        ]
    },
    {
        text: 'Что такое array в Go?',
        options: [
            {
                text: 'Динамическая коллекция',
            },
            {
                text: 'Фиксированная последовательность элементов одного типа',
                correct: true,
            },
            {
                text: 'Ключ-значение структура',
            },
            {
                text: 'Тип для функций',
            },
        ]
    },
    {
        text: 'Как объявить slice?',
        options: [
            {
                text: '[5]int{1,2,3,4,5}',
            },
            {
                text: '[]int{1,2,3}',
                correct: true,
            },
            {
                text: 'map[int]int{1:1}',
            },
            {
                text: 'make(chan int)',
            },
        ]
    },
    {
        text: 'Что возвращает append для slice?',
        options: [
            {
                text: 'Изменяет оригинал in-place',
            },
            {
                text: 'Возвращает новый slice (возможно с realloc)',
                correct: true,
            },
            {
                text: 'Ничего, void',
            },
            {
                text: 'Ошибку если cap превышен',
            },
        ]
    },
    {
        text: 'Как объявить map?',
        options: [
            {
                text: '[]string{"key": "value"}',
            },
            {
                text: 'map[string]string{"key": "value"}',
                correct: true,
            },
            {
                text: '[string]string{"key": "value"}',
            },
            {
                text: 'struct { key string; value string }',
            },
        ]
    },
    {
        text: 'Как проверить наличие ключа в map?',
        options: [
            {
                text: 'val = m[key]; if val != nil',
            },
            {
                text: 'val, ok := m[key]; if ok',
                correct: true,
            },
            {
                text: 'if m[key]',
            },
            {
                text: 'len(m[key])',
            },
        ]
    },
    {
        text: 'Что такое struct в Go?',
        options: [
            {
                text: 'Тип для каналов',
            },
            {
                text: 'Составной тип с полями',
                correct: true,
            },
            {
                text: 'Динамический массив',
            },
            {
                text: 'Интерфейс методов',
            },
        ]
    },
    {
        text: 'Как объявить pointer?',
        options: [
            {
                text: 'var p int',
            },
            {
                text: 'var p *int',
                correct: true,
            },
            {
                text: 'p := int',
            },
            {
                text: '&p int',
            },
        ]
    },
    {
        text: 'Что такое dereferencing для pointer?',
        options: [
            {
                text: 'Взятие адреса &p',
            },
            {
                text: 'Доступ к значению *p',
                correct: true,
            },
            {
                text: 'Создание new(p)',
            },
            {
                text: 'Итерация range p',
            },
        ]
    },
    {
        text: 'Как объявить тип функции?',
        options: [
            {
                text: 'var f func(int) int',
                correct: true,
            },
            {
                text: 'var f *int',
            },
            {
                text: 'type f struct {}',
            },
            {
                text: 'func f(int) int',
            },
        ]
    },
    {
        text: 'Что такое channel в Go?',
        options: [
            {
                text: 'Тип для коллекций',
            },
            {
                text: 'Канал для общения между goroutines',
                correct: true,
            },
            {
                text: 'Указатель на функцию',
            },
            {
                text: 'Интерфейс для методов',
            },
        ]
    },
    {
        text: 'Как объявить interface?',
        options: [
            {
                text: 'type I struct { Method() }',
            },
            {
                text: 'type I interface { Method() }',
                correct: true,
            },
            {
                text: 'interface I { Method() }',
            },
            {
                text: 'func I { Method() }',
            },
        ]
    },
    {
        text: 'Какая типичная ошибка с len(string) для не-ASCII строк?',
        options: [
            {
                text: 'Возвращает количество рун',
            },
            {
                text: 'Возвращает количество байтов, а не рун',
                correct: true,
            },
            {
                text: 'Паника',
            },
            {
                text: '0 всегда',
            },
        ]
    },
    {
        text: 'Что происходит, если объявить переменную и не использовать?',
        options: [
            {
                text: 'Ничего, игнорируется',
            },
            {
                text: 'Ошибка компиляции: declared but not used',
                correct: true,
            },
            {
                text: 'Предупреждение',
            },
            {
                text: 'Автоматическое удаление',
            },
        ]
    },
    {
        text: 'Можно ли начинать имя переменной с цифры?',
        options: [
            {
                text: 'Да',
            },
            {
                text: 'Нет, только буква или _',
                correct: true,
            },
            {
                text: 'Только в функциях',
            },
            {
                text: 'Только для констант',
            },
        ]
    },
    {
        text: 'Какой нулевое значение для pointer?',
        options: [
            {
                text: '0',
            },
            {
                text: 'nil',
                correct: true,
            },
            {
                text: 'false',
            },
            {
                text: '""',
            },
        ]
    },
    {
        text: 'Как объявить анонимную struct?',
        options: [
            {
                text: 'type {} struct',
            },
            {
                text: 'struct { Field int }{Field: 1}',
                correct: true,
            },
            {
                text: 'anon := struct',
            },
            {
                text: 'new(struct)',
            },
        ]
    },
    {
        text: 'Что такое make в Go?',
        options: [
            {
                text: 'Создаёт переменные',
            },
            {
                text: 'Инициализирует slice, map, chan',
                correct: true,
            },
            {
                text: 'Преобразует типы',
            },
            {
                text: 'Объявляет функции',
            },
        ]
    },
    {
        text: 'Какой тип является reference type?',
        options: [
            {
                text: 'Array',
            },
            {
                text: 'Slice',
                correct: true,
            },
            {
                text: 'Struct',
            },
            {
                text: 'Int',
            },
        ]
    },
    {
        text: 'Что происходит при слайсинге slice[1:3]?',
        options: [
            {
                text: 'Копирует данные',
            },
            {
                text: 'Создаёт view на оригинал',
                correct: true,
            },
            {
                text: 'Удаляет элементы',
            },
            {
                text: 'Добавляет элементы',
            },
        ]
    },
    {
        text: 'Можно ли использовать slice как ключ в map?',
        options: [
            {
                text: 'Да',
            },
            {
                text: 'Нет, ключи должны быть comparable',
                correct: true,
            },
            {
                text: 'Только если len=0',
            },
            {
                text: 'Только для string slice',
            },
        ]
    },
    {
        text: 'Что такое embedding в struct?',
        options: [
            {
                text: 'Встраивание полей/методов от другой struct',
                correct: true,
            },
            {
                text: 'Добавление указателя',
            },
            {
                text: 'Создание массива struct',
            },
            {
                text: 'Импорт пакета',
            },
        ]
    },
    {
        text: 'Как реализовать interface в Go?',
        options: [
            {
                text: 'Explicitly с implements',
            },
            {
                text: 'Implicitly, реализуя методы',
                correct: true,
            },
            {
                text: 'Через type assertion',
            },
            {
                text: 'Через generics',
            },
        ]
    },
    {
        text: 'Что такое type assertion для interface?',
        options: [
            {
                text: 'Преобразование типов',
            },
            {
                text: 'Извлечение underlying типа: i.(Type)',
                correct: true,
            },
            {
                text: 'Объявление нового типа',
            },
            {
                text: 'Проверка на nil',
            },
        ]
    },
    {
        text: 'Какой нулевое значение для slice?',
        options: [
            {
                text: '[]',
            },
            {
                text: 'nil',
                correct: true,
            },
            {
                text: '{}',
            },
            {
                text: '0',
            },
        ]
    },
    {
        text: 'Можно ли изменить размер array после объявления?',
        options: [
            {
                text: 'Да, с append',
            },
            {
                text: 'Нет, фиксированный',
                correct: true,
            },
            {
                text: 'Только если cap > len',
            },
            {
                text: 'Через make',
            },
        ]
    },
    {
        text: 'Что возвращает delete для map?',
        options: [
            {
                text: 'Значение',
            },
            {
                text: 'Ничего, void',
                correct: true,
            },
            {
                text: 'ok bool',
            },
            {
                text: 'Новый map',
            },
        ]
    },
    {
        text: 'Как получить адрес переменной?',
        options: [
            {
                text: '*var',
            },
            {
                text: '&var',
                correct: true,
            },
            {
                text: 'new(var)',
            },
            {
                text: 'make(var)',
            },
        ]
    },
    {
        text: 'Что такое closure в function type?',
        options: [
            {
                text: 'Функция без имени',
            },
            {
                text: 'Анонимная функция, захватывающая переменные',
                correct: true,
            },
            {
                text: 'Тип для chan',
            },
            {
                text: 'Метод struct',
            },
        ]
    },
    {
        text: 'Как создать буферизованный channel?',
        options: [
            {
                text: 'chan int',
            },
            {
                text: 'make(chan int, 5)',
                correct: true,
            },
            {
                text: '[]chan int',
            },
            {
                text: 'new(chan int)',
            },
        ]
    },
    {
        text: 'Что такое duck typing в interface?',
        options: [
            {
                text: 'Explicit реализация',
            },
            {
                text: 'Implicit: если методы есть — реализует',
                correct: true,
            },
            {
                text: 'Тип для уток',
            },
            {
                text: 'Преобразование типов',
            },
        ]
    },
    {
        text: 'Какой тип является value type?',
        options: [
            {
                text: 'Slice',
            },
            {
                text: 'Array',
                correct: true,
            },
            {
                text: 'Map',
            },
            {
                text: 'Pointer',
            },
        ]
    },
];
</script>