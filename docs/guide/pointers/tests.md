# Тестирование

<QuizContainer :questions />

<script setup>
const questions = [
    {
        text: 'Что такое указатель в Go?',
        options: [
            {
                text: 'Переменная, хранящая значение',
            },
            {
                text: 'Переменная, хранящая адрес в памяти другой переменной',
                correct: true,
            },
            {
                text: 'Тип для коллекций',
            },
            {
                text: 'Функция для итерации',
            },
        ]
    },
    {
        text: 'Как объявить указатель на int?',
        options: [
            {
                text: 'var ptr int',
            },
            {
                text: 'var ptr *int',
                correct: true,
            },
            {
                text: 'ptr := int',
            },
            {
                text: '&ptr int',
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
        text: 'Что такое dereferencing для указателя?',
        options: [
            {
                text: 'Взятие адреса &p',
            },
            {
                text: 'Доступ к значению по адресу *p',
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
        text: 'Какое нулевое значение для указателя?',
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
        text: 'Что происходит при dereferencing nil-указателя?',
        options: [
            {
                text: 'Возвращает zero value',
            },
            {
                text: 'Panic в runtime',
                correct: true,
            },
            {
                text: 'Ошибка компиляции',
            },
            {
                text: 'Ничего, игнорируется',
            },
        ]
    },
    {
        text: 'Зачем используются указатели в функциях?',
        options: [
            {
                text: 'Для копирования значений',
            },
            {
                text: 'Для изменения оригинальных значений (pass by reference)',
                correct: true,
            },
            {
                text: 'Для создания циклов',
            },
            {
                text: 'Для импорта пакетов',
            },
        ]
    },
    {
        text: 'Как объявить указатель на slice?',
        options: [
            {
                text: 'var ptr []int',
            },
            {
                text: 'var ptr *[]int',
                correct: true,
            },
            {
                text: 'ptr := []int',
            },
            {
                text: 'make(*[]int)',
            },
        ]
    },
    {
        text: 'Почему нужны указатели на slice, если slice уже reference type?',
        options: [
            {
                text: 'Чтобы изменить элементы',
            },
            {
                text: 'Чтобы перезаписать сам slice (nil или новый)',
                correct: true,
            },
            {
                text: 'Чтобы копировать данные',
            },
            {
                text: 'Нет нужды, это бесполезно',
            },
        ]
    },
    {
        text: 'Как изменить slice через указатель в функции?',
        options: [
            {
                text: 'f(s []int); s = append(s, 1)',
            },
            {
                text: 'f(s *[]int); *s = append(*s, 1)',
                correct: true,
            },
            {
                text: 'f(&s); s++',
            },
            {
                text: 'append(&s, 1)',
            },
        ]
    },
    {
        text: 'Как объявить указатель на map?',
        options: [
            {
                text: 'var m map[string]int',
            },
            {
                text: 'var m *map[string]int',
                correct: true,
            },
            {
                text: 'make(*map[string]int)',
            },
            {
                text: 'm := map[string]int',
            },
        ]
    },
    {
        text: 'Зачем указатель на map в функции?',
        options: [
            {
                text: 'Чтобы добавить элементы',
            },
            {
                text: 'Чтобы перезаписать map целиком или сделать nil',
                correct: true,
            },
            {
                text: 'Чтобы копировать map',
            },
            {
                text: 'Нет нужды',
            },
        ]
    },
    {
        text: 'Как использовать указатель как поле в struct?',
        options: [
            {
                text: 'type S struct { Field int }',
            },
            {
                text: 'type S struct { Field *int }',
                correct: true,
            },
            {
                text: 'type S *struct { Field int }',
            },
            {
                text: '&type S struct { Field int }',
            },
        ]
    },
    {
        text: 'Что такое pointer receiver в методе struct?',
        options: [
            {
                text: 'func (s S) Method()',
            },
            {
                text: 'func (s *S) Method()',
                correct: true,
            },
            {
                text: 'func * (s S) Method()',
            },
            {
                text: 'func (s S*) Method()',
            },
        ]
    },
    {
        text: 'Зачем pointer receiver в методе?',
        options: [
            {
                text: 'Для копирования struct',
            },
            {
                text: 'Для изменения оригинальной struct',
                correct: true,
            },
            {
                text: 'Для чтения только',
            },
            {
                text: 'Для экспорта',
            },
        ]
    },
    {
        text: 'Что такое embedding с указателем в struct?',
        options: [
            {
                text: 'type S struct { T }',
            },
            {
                text: 'type S struct { *T }',
                correct: true,
            },
            {
                text: 'type S *struct { T }',
            },
            {
                text: '&type S struct { T }',
            },
        ]
    },
    {
        text: 'Зачем embedding с указателем?',
        options: [
            {
                text: 'Для фиксированных полей',
            },
            {
                text: 'Для опциональных (nil) встроенных частей',
                correct: true,
            },
            {
                text: 'Для копирования',
            },
            {
                text: 'Для циклов',
            },
        ]
    },
    {
        text: 'Что такое pointer receiver в интерфейсе?',
        options: [
            {
                text: 'Метод на value type',
            },
            {
                text: 'Метод на *Type для изменений',
                correct: true,
            },
            {
                text: 'Указатель на chan',
            },
            {
                text: 'Тип для map',
            },
        ]
    },
    {
        text: 'Почему value type может не реализовывать интерфейс с pointer receiver?',
        options: [
            {
                text: 'Потому что value копируется',
            },
            {
                text: 'Интерфейс требует pointer для методов на *Type',
                correct: true,
            },
            {
                text: 'Из-за nil',
            },
            {
                text: 'Нет разницы',
            },
        ]
    },
    {
        text: 'Как объявить указатель на функцию?',
        options: [
            {
                text: 'var f func()',
            },
            {
                text: 'var f *func()',
                correct: true,
            },
            {
                text: 'f := func()',
            },
            {
                text: '&f func()',
            },
        ]
    },
    {
        text: 'Зачем указатель на функцию?',
        options: [
            {
                text: 'Для вызова функции',
            },
            {
                text: 'Для изменения ссылки на функцию динамически',
                correct: true,
            },
            {
                text: 'Для циклов',
            },
            {
                text: 'Для импорта',
            },
        ]
    },
    {
        text: 'Как объявить указатель на channel?',
        options: [
            {
                text: 'var ch chan int',
            },
            {
                text: 'var ch *chan int',
                correct: true,
            },
            {
                text: 'make(*chan int)',
            },
            {
                text: 'ch := chan int',
            },
        ]
    },
    {
        text: 'Зачем указатель на channel?',
        options: [
            {
                text: 'Для отправки значений',
            },
            {
                text: 'Для перезаписи channel (nil или новый)',
                correct: true,
            },
            {
                text: 'Для копирования',
            },
            {
                text: 'Нет нужды',
            },
        ]
    },
    {
        text: 'Как объявить указатель на интерфейс?',
        options: [
            {
                text: 'var i Interface',
            },
            {
                text: 'var i *Interface',
                correct: true,
            },
            {
                text: 'i := Interface',
            },
            {
                text: 'type *Interface',
            },
        ]
    },
    {
        text: 'Зачем указатель на интерфейс?',
        options: [
            {
                text: 'Для вызова методов',
            },
            {
                text: 'Для изменения значения интерфейса динамически',
                correct: true,
            },
            {
                text: 'Для создания chan',
            },
            {
                text: 'Нет нужды',
            },
        ]
    },
    {
        text: 'Что такое многоуровневый указатель (**T)?',
        options: [
            {
                text: 'Указатель на значение',
            },
            {
                text: 'Указатель на указатель',
                correct: true,
            },
            {
                text: 'Массив указателей',
            },
            {
                text: 'Функция с указателями',
            },
        ]
    },
    {
        text: 'Зачем многоуровневый указатель?',
        options: [
            {
                text: 'Для простых изменений',
            },
            {
                text: 'Для изменения самого указателя (например, в функциях)',
                correct: true,
            },
            {
                text: 'Для циклов',
            },
            {
                text: 'Для импорта',
            },
        ]
    },
    {
        text: 'Что такое unsafe.Pointer?',
        options: [
            {
                text: 'Обычный указатель',
            },
            {
                text: 'Универсальный указатель для обхода type safety',
                correct: true,
            },
            {
                text: 'Указатель на chan',
            },
            {
                text: 'Тип для interface',
            },
        ]
    },
    {
        text: 'Когда использовать unsafe?',
        options: [
            {
                text: 'Всегда для производительности',
            },
            {
                text: 'Только для low-level (CGO, hacks), опасно',
                correct: true,
            },
            {
                text: 'Для циклов',
            },
            {
                text: 'Для переменных',
            },
        ]
    },
    {
        text: 'Что такое nil в указателях?',
        options: [
            {
                text: '0 для int',
            },
            {
                text: 'Значение "ничего", по умолчанию для указателей',
                correct: true,
            },
            {
                text: 'Пустая строка',
            },
            {
                text: 'false',
            },
        ]
    },
    {
        text: 'Как проверить указатель на nil?',
        options: [
            {
                text: 'if ptr == 0',
            },
            {
                text: 'if ptr == nil',
                correct: true,
            },
            {
                text: 'if *ptr',
            },
            {
                text: 'if len(ptr) == 0',
            },
        ]
    },
    {
        text: 'Зачем указатели в структурах как поля?',
        options: [
            {
                text: 'Для фиксированных полей',
            },
            {
                text: 'Для опциональных полей (nil)',
                correct: true,
            },
            {
                text: 'Для циклов',
            },
            {
                text: 'Для импорта',
            },
        ]
    },
    {
        text: 'Что такое promotion в embedded struct с указателем?',
        options: [
            {
                text: 'Копирование полей',
            },
            {
                text: 'Доступ к полям/методам напрямую, но с nil-чеком',
                correct: true,
            },
            {
                text: 'Изменение типа',
            },
            {
                text: 'Создание chan',
            },
        ]
    },
    {
        text: 'Разница между nil interface и interface с nil value?',
        options: [
            {
                text: 'Нет разницы',
            },
            {
                text: 'Nil interface == nil, но с nil value != nil, но метод panic',
                correct: true,
            },
            {
                text: 'Оба panic',
            },
            {
                text: 'Оба == nil',
            },
        ]
    },
    {
        text: 'Зачем указатели на функции в структурах?',
        options: [
            {
                text: 'Для методов',
            },
            {
                text: 'Для динамического поведения (смены функций)',
                correct: true,
            },
            {
                text: 'Для циклов',
            },
            {
                text: 'Для nil',
            },
        ]
    },
    {
        text: 'Как вызвать функцию через указатель на функцию?',
        options: [
            {
                text: 'ptr(arg)',
            },
            {
                text: '(*ptr)(arg)',
                correct: true,
            },
            {
                text: '&ptr(arg)',
            },
            {
                text: 'ptr.(arg)',
            },
        ]
    },
    {
        text: 'Зачем unsafe.Sizeof?',
        options: [
            {
                text: 'Для длины строки',
            },
            {
                text: 'Для размера типа в байтах',
                correct: true,
            },
            {
                text: 'Для cap slice',
            },
            {
                text: 'Для len map',
            },
        ]
    },
    {
        text: 'Что такое aрифметика указателей в unsafe?',
        options: [
            {
                text: 'ptr + 1 как в базовом Go',
            },
            {
                text: 'Через uintptr(ptr) + offset',
                correct: true,
            },
            {
                text: '*ptr + 1',
            },
            {
                text: 'Не поддерживается',
            },
        ]
    },
    {
        text: 'Почему Go избегает арифметики указателей в базовом языке?',
        options: [
            {
                text: 'Для скорости',
            },
            {
                text: 'Для безопасности (избежать ошибок памяти)',
                correct: true,
            },
            {
                text: 'Для простоты синтаксиса',
            },
            {
                text: 'Нет GC',
            },
        ]
    },
];
</script>