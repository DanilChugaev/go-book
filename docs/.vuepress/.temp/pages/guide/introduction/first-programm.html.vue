<template><div><h1 id="первая-программа-hello-world" tabindex="-1"><a class="header-anchor" href="#первая-программа-hello-world"><span>Первая программа: Hello World</span></a></h1>
<p>В предыдущем разделе мы привели простейшую программу — &quot;Hello World&quot;. Теперь разберём её подробнее: что происходит шаг за шагом, из каких базовых частей она состоит, и почему Go работает именно так. Это поможет понять фундамент языка. Затем опишем процесс компиляции в бинарный файл (<code v-pre>go build</code>) и что происходит после этого на каждой платформе (Windows, macOS, Linux).</p>
<p>Используй VS Code, скопируй код и попробуй запустить — это лучший способ закрепить информацию.</p>
<h2 id="программа" tabindex="-1"><a class="header-anchor" href="#программа"><span>Программа:</span></a></h2>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token comment">// package main — каждый файл начинается с package</span></span>
<span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token comment">// Импорт пакетов (fmt для печати)</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token string">"fmt"</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// Главная функция — точка входа</span></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">"Hello, Go!"</span><span class="token punctuation">)</span>  <span class="token comment">// Вывод в консоль</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="базовые-части-программы-из-чего-состоит-код" tabindex="-1"><a class="header-anchor" href="#базовые-части-программы-из-чего-состоит-код"><span>Базовые части программы: Из чего состоит код?</span></a></h2>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p>Go-программа — это набор файлов в пакете (package). Каждый файл начинается с объявления пакета, импортов и определений (функций, типов и т.д.).</p>
</div>
<h2 id="разберем-код-по-строкам" tabindex="-1"><a class="header-anchor" href="#разберем-код-по-строкам"><span>Разберём код по строкам</span></a></h2>
<h3 id="строка-1-комментарии" tabindex="-1"><a class="header-anchor" href="#строка-1-комментарии"><span>Строка 1: Комментарий</span></a></h3>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token comment">// package main — каждый файл начинается с package</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>Это однострочный комментарий (начинается с <code v-pre>//</code>). Go игнорирует его при компиляции. Комментарии полезны для документации. Есть и многострочные: <code v-pre>/* ... */</code>.</p>
<p><strong>Почему?</strong> Чтобы код был читаемым для людей. В реальных проектах добавляй комментарии для сложных частей.</p>
<h3 id="строка-2-объявление-пакета" tabindex="-1"><a class="header-anchor" href="#строка-2-объявление-пакета"><span>Строка 2: Объявление пакета</span></a></h3>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 1"><div class="line-number"></div></div></div><p>Каждый Go-файл должен начинаться с <code v-pre>package &lt;name&gt;</code>. Здесь <code v-pre>main</code> — специальный пакет, обозначающий исполняемую программу (executable). Другие пакеты (например, <code v-pre>package utils</code>) — для библиотек.</p>
<p><strong>Что происходит?</strong> Go группирует код в пакеты для модульности. <code v-pre>main</code> — точка входа в приложение. Без него программа не запустится как самостоятельная.</p>
<p><strong>Аналогия</strong>: Пакет — как глава в книге. <code v-pre>main</code> — это &quot;введение&quot;, где начинается история.</p>
<h3 id="строка-5-импорт-пакетов" tabindex="-1"><a class="header-anchor" href="#строка-5-импорт-пакетов"><span>Строка 5: Импорт пакетов</span></a></h3>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token string">"fmt"</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 4"><div class="line-number"></div></div></div><p><code v-pre>import</code> подключает внешние пакеты (библиотеки). Здесь <code v-pre>fmt</code> — стандартный пакет для форматированного ввода/вывода (format). Без импорта ты не можешь использовать <code v-pre>fmt.Println</code>.</p>
<p><strong>Что происходит?</strong> При компиляции Go ищет пакет в стандартной библиотеке (GOROOT) или в зависимостях (GOPATH/modules). Если пакета нет — ошибка.</p>
<p><strong>Почему?</strong> Go поощряет переиспользование кода. Стандартная библиотека богата (net/http для серверов, os для файлов и т.д.). Для нескольких импортов используй скобки <code v-pre>()</code>:</p>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">    <span class="token string">"fmt"</span></span>
<span class="line">    <span class="token string">"os"</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 4"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>Совет</strong>: Не импортируй лишнее — Go компилятор выдаст ошибку на unused imports.</p>
<h3 id="строка-8-10-определение-функции" tabindex="-1"><a class="header-anchor" href="#строка-8-10-определение-функции"><span>Строка 8-10: Определение функции</span></a></h3>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">"Hello, Go!"</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 7"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>func</code> — ключевое слово для функций. <code v-pre>main()</code> — специальная функция: точка входа, откуда начинается выполнение. Она не принимает аргументов и ничего не возвращает (void).</p>
<p>Внутри: <code v-pre>fmt.Println(&quot;Hello, Go!&quot;)</code> — вызов функции <code v-pre>Println</code> из пакета <code v-pre>fmt</code>. Она выводит строку в стандартный вывод (консоль) и добавляет новую строку (\n).</p>
<h3 id="что-происходит-шаг-за-шагом-при-запуске" tabindex="-1"><a class="header-anchor" href="#что-происходит-шаг-за-шагом-при-запуске"><span>Что происходит шаг за шагом при запуске?</span></a></h3>
<ol>
<li>Go-рантайм (runtime) запускает функцию <code v-pre>main()</code>.</li>
<li><code v-pre>fmt.Println</code> берёт аргумент (&quot;Hello, Go!&quot;) — это строка (string literal).</li>
<li>Она конвертирует строку в байты (UTF-8) и отправляет в stdout (стандартный вывод ОС).</li>
<li>Программа завершается (exit code 0, если без ошибок).</li>
</ol>
<p><strong>Аналогия</strong>: <code v-pre>main()</code> — как кнопка &quot;Старт&quot; в приложении. Без неё ничего не запустится.</p>
<p><strong>Почему нет возврата?</strong> В Go <code v-pre>main</code> не возвращает значение — ошибки обрабатываются внутри (panic или os.Exit).</p>
<h3 id="общии-процесс-выполнения-программы" tabindex="-1"><a class="header-anchor" href="#общии-процесс-выполнения-программы"><span>Общий процесс выполнения программы:</span></a></h3>
<ul>
<li>Когда ты запускаешь <code v-pre>go run main.go</code>, Go компилирует код в память (временно) и исполняет.</li>
<li>Если ошибок нет (синтаксис, типы) — вывод в консоль.</li>
<li>Go — статически типизированный: все типы проверяются на этапе компиляции, нет runtime-ошибок типов (как в Python).</li>
</ul>
<h3 id="советы-по-отладке" tabindex="-1"><a class="header-anchor" href="#советы-по-отладке"><span>Советы по отладке</span></a></h3>
<ul>
<li>Если ошибка: Читайте сообщение (Go даёт точные: &quot;undefined: fmt&quot; если без импорта).</li>
<li>Добавьте <code v-pre>fmt.Printf(&quot;Debug: %s\n&quot;, variable)</code> для отладки.</li>
</ul>
<h2 id="компиляция-в-бинарныи-фаил-что-такое-go-build-и-зачем" tabindex="-1"><a class="header-anchor" href="#компиляция-в-бинарныи-фаил-что-такое-go-build-и-зачем"><span>Компиляция в бинарный файл: Что такое <code v-pre>go build</code> и зачем?</span></a></h2>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p>Go — компилируемый язык: код преобразуется в машинный код (бинарник), который ОС исполняет напрямую (без интерпретатора как в Python). Команда <code v-pre>go build</code> создаёт исполняемый файл.</p>
</div>
<h3 id="что-происходит-при-go-build" tabindex="-1"><a class="header-anchor" href="#что-происходит-при-go-build"><span>Что происходит при <code v-pre>go build</code>?</span></a></h3>
<ul>
<li>Go-компилятор (gc) анализирует код: проверяет синтаксис, типы, импорты.</li>
<li>Линкует с стандартной библиотекой (включая runtime для GC, goroutines).</li>
<li>Производит оптимизированный бинарник: статически слинкованный (все зависимости внутри, нет DLL/shared libs).</li>
<li>Результат: Один файл, который работает на целевой ОС без установки Go.</li>
</ul>
<p><strong>Преимущества</strong>: Быстрый запуск, портативность (скопируй бинарник и запусти на другой машине той же ОС/архитектуры).</p>
<p><strong>Команда</strong>: В директории с <code v-pre>main.go</code> выполни <code v-pre>go build</code> — создаст файл (main.exe на Windows, main на Unix-like).</p>
<p><strong>Кросс-компиляция</strong>: <code v-pre>GOOS=linux GOARCH=amd64 go build</code> — скомпилируй для Linux на Windows.</p>
<p>Теперь разберём, что происходит после компиляции для каждой системы. Предполагаем, что ты скомпилировал программу в бинарник (например, <code v-pre>hello</code> или <code v-pre>hello.exe</code>).</p>
<h3 id="для-windows" tabindex="-1"><a class="header-anchor" href="#для-windows"><span>Для Windows</span></a></h3>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p><strong>Бинарник</strong>: Файл с расширением <code v-pre>.exe</code> (например, <code v-pre>main.exe</code>). Это PE (Portable Executable) формат — стандарт Windows для исполняемых файлов.</p>
</div>
<p><strong>Что происходит после компиляции?</strong></p>
<ol>
<li><code v-pre>go build</code> создаёт <code v-pre>main.exe</code> в текущей директории (размер ~2-5 MB, включает runtime).</li>
<li>Чтобы запустить: Двойной клик на <code v-pre>main.exe</code> (откроется консоль и выведет &quot;Hello, Go!&quot;, затем закроется) или в cmd: <code v-pre>./main.exe</code>.</li>
<li>ОС (Windows) загружает PE-файл в память: Разбирает заголовки, аллоцирует память, запускает entry point (которая вызывает Go-runtime).</li>
<li>Go-runtime инициализируется: Настраивает GC, scheduler для goroutines (даже если их нет).</li>
<li>Выполняется <code v-pre>main()</code>, вывод в консоль через WinAPI (stdout).</li>
<li>Программа завершается, runtime чистит память (GC), ОС освобождает ресурсы.</li>
</ol>
<p><strong>Особенности</strong>: Бинарник самодостаточный — работает без Go на машине. Если консоль закрывается быстро, добавь <code v-pre>time.Sleep</code> или читай ввод (<code v-pre>fmt.Scanln()</code>).</p>
<p><strong>Проверка</strong>: <code v-pre>main.exe /?</code> — не сработает, т.к. нет args, но можно добавить с <code v-pre>os.Args</code>.</p>
<h3 id="для-macos" tabindex="-1"><a class="header-anchor" href="#для-macos"><span>Для macOS</span></a></h3>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p><strong>Бинарник</strong>: Файл без расширения (например, <code v-pre>main</code>). Это Mach-O формат — стандарт macOS для исполняемых файлов (аналог ELF в Linux).</p>
</div>
<p><strong>Что происходит после компиляции?</strong></p>
<ol>
<li><code v-pre>go build</code> создаёт <code v-pre>main</code> в текущей директории (размер ~2-5 MB).</li>
<li>Чтобы запустить: В Terminal <code v-pre>./main</code> (сделай исполняемым: <code v-pre>chmod +x main</code>, если нужно).</li>
<li>ОС (macOS/Darwin) загружает Mach-O: Парсит сегменты (text, data), маппит в память, вызывает entry point.</li>
<li>Go-runtime стартует: Инициализирует GC, scheduler (интегрируется с mach threads).</li>
<li>Выполняется <code v-pre>main()</code>, вывод в stdout через syscalls (Darwin API).</li>
<li>Завершение: Runtime выгружает, ОС чистит (no leaks благодаря GC).</li>
</ol>
<p><strong>Особенности</strong>: На Apple Silicon (M1+) — нативный arm64. Бинарник портативен: Скопируй на другой Mac и запусти без Go. Для GUI — используй пакеты вроде fyne.</p>
<p><strong>Проверка</strong>: <code v-pre>file main</code> — покажет &quot;Mach-O 64-bit executable arm64&quot;.</p>
<h3 id="для-linux" tabindex="-1"><a class="header-anchor" href="#для-linux"><span>Для Linux</span></a></h3>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p><strong>Бинарник</strong>: Файл без расширения (например, <code v-pre>main</code>). Это ELF (Executable and Linkable Format) — стандарт Unix-like для бинарников.</p>
</div>
<p><strong>Что происходит после компиляции?</strong></p>
<ol>
<li><code v-pre>go build</code> создаёт <code v-pre>main</code> в текущей директории (размер ~2-5 MB).</li>
<li>Чтобы запустить: <code v-pre>./main</code> (сделай исполняемым: <code v-pre>chmod +x main</code>).</li>
<li>ОС (Linux kernel) загружает ELF: Читает header, загружает сегменты в виртуальную память, устанавливает stack/heap, вызывает _start (которая ведёт к Go-runtime).</li>
<li>Go-runtime инициализируется: Настраивает GC, использует pthreads для goroutines.</li>
<li>Выполняется <code v-pre>main()</code>, вывод в stdout через syscalls (write to fd 1).</li>
<li>Завершение: Runtime вызывает exit, kernel освобождает процессы.</li>
</ol>
<p><strong>Особенности</strong>: Бинарник статический — работает на любом Linux без зависимостей (glibc etc.). Для контейнеров (Docker) — идеально (scratch image).</p>
<p><strong>Проверка</strong>: <code v-pre>file main</code> — &quot;ELF 64-bit LSB pie executable, x86-64&quot;.</p>
<h2 id="общие-советы-по-компиляции" tabindex="-1"><a class="header-anchor" href="#общие-советы-по-компиляции"><span>Общие советы по компиляции:</span></a></h2>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go build <span class="token parameter variable">-o</span> customname <span class="token comment"># укажи имя бинарника</span></span>
<span class="line">go build <span class="token parameter variable">-ldflags</span><span class="token operator">=</span><span class="token string">"-s -w"</span> <span class="token comment"># для релиза уменьши размер (strip symbols)</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Ошибки: Если &quot;no Go files&quot; — убедись в <code v-pre>package main</code>.</li>
<li>Кросс-платформа: Скомпилируй на одной ОС для другой — Go поддерживает 20+ платформ.</li>
</ul>
</div></template>


