<template><div><h1 id="установка-и-настроика" tabindex="-1"><a class="header-anchor" href="#установка-и-настроика"><span>Установка и настройка</span></a></h1>
<h2 id="общая-информация" tabindex="-1"><a class="header-anchor" href="#общая-информация"><span>Общая информация</span></a></h2>
<p>Установка Go — это первый шаг к программированию на этом языке. Go распространяется в виде бинарных дистрибутивов, которые легко установить на большинстве платформ. Процесс включает скачивание, установку, настройку переменных окружения и проверку.</p>
<div class="hint-container info">
<p class="hint-container-title">Инфо</p>
<p>Инструкции актуальны на ноябрь 2025 года (последняя стабильная версия Go — 1.23.x или новее; проверьте на официальном сайте go.dev для обновлений).</p>
</div>
<h2 id="рекомендации-перед-началом" tabindex="-1"><a class="header-anchor" href="#рекомендации-перед-началом"><span>Рекомендации перед началом:</span></a></h2>
<ul>
<li>Скачивайте с официального сайта: https://go.dev/dl/ (или golang.org/dl/).</li>
<li>Выберите версию для вашей архитектуры (amd64 для большинства ПК, arm64 для M1/M2 Mac).</li>
<li>После установки настройте переменные окружения: <code v-pre>GOROOT</code> (директория установки Go), <code v-pre>GOPATH</code> (директория для ваших проектов, по умолчанию <code v-pre>~/go</code>), и добавьте <code v-pre>GOROOT/bin</code> в <code v-pre>PATH</code>.</li>
<li>Для модулей (рекомендуется с Go 1.11+): Используйте <code v-pre>go mod init</code> в проектах — это упрощает управление зависимостями.</li>
<li>Если возникнут проблемы, читайте документацию: https://go.dev/doc/install.</li>
<li>Тестируйте установку командой <code v-pre>go version</code> в терминале/командной строке.</li>
</ul>
<p>Теперь разберём по платформам.</p>
<h2 id="windows" tabindex="-1"><a class="header-anchor" href="#windows"><span>Windows</span></a></h2>
<p>Windows поддерживает Go хорошо, но настройка переменных окружения требует внимания (используйте GUI или PowerShell). Подходит для Windows 10/11 (64-bit).</p>
<h3 id="шаг-1-скачивание-дистрибутива" tabindex="-1"><a class="header-anchor" href="#шаг-1-скачивание-дистрибутива"><span>Шаг 1: Скачивание дистрибутива</span></a></h3>
<ul>
<li>Откройте браузер и перейдите на https://go.dev/dl/.</li>
<li>Найдите раздел &quot;Featured downloads&quot; или прокрутите вниз.</li>
<li>Выберите файл для Windows: <code v-pre>go1.23.x.windows-amd64.msi</code> (для 64-bit Intel/AMD) или <code v-pre>go1.23.x.windows-arm64.msi</code> (для ARM, редко).</li>
<li>Нажмите &quot;Download&quot; и сохраните файл (размер ~150 MB).</li>
</ul>
<h3 id="шаг-2-установка" tabindex="-1"><a class="header-anchor" href="#шаг-2-установка"><span>Шаг 2: Установка</span></a></h3>
<ul>
<li>Запустите скачанный .msi-файл (двойной клик).</li>
<li>В окне установщика:
<ul>
<li>Примите лицензию (License Agreement) — нажмите &quot;Next&quot;.</li>
<li>Выберите директорию установки: По умолчанию <code v-pre>C:\Program Files\Go</code> (рекомендую не менять, это будет GOROOT).</li>
<li>Убедитесь, что галочка &quot;Add Go to PATH&quot; стоит (если нет — поставьте).</li>
<li>Нажмите &quot;Next&quot; &gt; &quot;Install&quot; и подтвердите UAC (User Account Control), если попросит.</li>
</ul>
</li>
<li>Дождитесь завершения (1-2 минуты). Нажмите &quot;Finish&quot;.</li>
</ul>
<h3 id="шаг-3-настроика-переменных-окружения-если-не-добавилось-автоматически" tabindex="-1"><a class="header-anchor" href="#шаг-3-настроика-переменных-окружения-если-не-добавилось-автоматически"><span>Шаг 3: Настройка переменных окружения (если не добавилось автоматически)</span></a></h3>
<ul>
<li>Правой кнопкой мыши на &quot;Этот компьютер&quot; (This PC) &gt; &quot;Свойства&quot; (Properties) &gt; &quot;Дополнительные параметры системы&quot; (Advanced system settings) &gt; &quot;Переменные среды&quot; (Environment Variables).</li>
<li>В разделе &quot;Системные переменные&quot; (System variables):
<ul>
<li>Нажмите &quot;Создать&quot; (New): Имя <code v-pre>GOROOT</code>, Значение <code v-pre>C:\Program Files\Go</code> (или ваша директория).</li>
<li>Найдите <code v-pre>Path</code>, нажмите &quot;Изменить&quot; (Edit) &gt; &quot;Создать&quot; (New) и добавьте <code v-pre>%GOROOT%\bin</code>.</li>
<li>Опционально: Создайте <code v-pre>GOPATH</code> с значением <code v-pre>C:\Users\ВашеИмя\go</code> (для проектов).</li>
</ul>
</li>
<li>Нажмите OK для сохранения.</li>
<li>Перезапустите командную строку (cmd или PowerShell), чтобы изменения применились.</li>
</ul>
<h3 id="шаг-4-проверка-установки" tabindex="-1"><a class="header-anchor" href="#шаг-4-проверка-установки"><span>Шаг 4: Проверка установки</span></a></h3>
<ul>
<li>Откройте командную строку (Win + R &gt; cmd &gt; Enter).</li>
<li>Выполните:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go version <span class="token comment"># должно вывести "go version go1.23.x windows/amd64"</span></span>
<span class="line">go <span class="token function">env</span> <span class="token comment"># проверьте GOROOT и GOPATH</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Создайте тестовый файл <code v-pre>hello.go</code>:</li>
</ul>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token string">"fmt"</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">"Hello, Go!"</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Запустите:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go run hello.go <span class="token comment"># выведет "Hello, Go!"</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h3 id="шаг-5-дополнительная-настроика" tabindex="-1"><a class="header-anchor" href="#шаг-5-дополнительная-настроика"><span>Шаг 5: Дополнительная настройка</span></a></h3>
<ul>
<li>Установите VS Code: Скачайте с code.visualstudio.com. Внутри VS Code установите расширение &quot;Go&quot; (от Google).</li>
<li>Если проблемы: Проверьте антивирус (может блокировать), или скачайте .zip-версию и разархивируйте вручную в <code v-pre>C:\Go</code>, затем настройте переменные.</li>
</ul>
<h2 id="macos" tabindex="-1"><a class="header-anchor" href="#macos"><span>macOS</span></a></h2>
<p>macOS (Ventura, Sonoma или новее) поддерживает Go нативно. Можно использовать официальный инсталлер или Homebrew (рекомендую для разработчиков).</p>
<h3 id="вариант-1-официальныи-инсталлер-простои" tabindex="-1"><a class="header-anchor" href="#вариант-1-официальныи-инсталлер-простои"><span>Вариант 1: Официальный инсталлер (простой)</span></a></h3>
<h4 id="шаг-1-скачивание" tabindex="-1"><a class="header-anchor" href="#шаг-1-скачивание"><span>Шаг 1: Скачивание</span></a></h4>
<ul>
<li>Перейдите на <a href="https://go.dev/dl/" target="_blank" rel="noopener noreferrer">https://go.dev/dl/</a>.</li>
<li>Выберите <code v-pre>go1.23.x.darwin-amd64.pkg</code> (для Intel) или <code v-pre>go1.23.x.darwin-arm64.pkg</code> (для Apple Silicon M1/M2+).</li>
<li>Скачайте (размер ~150 MB).</li>
</ul>
<h4 id="шаг-2-установка-1" tabindex="-1"><a class="header-anchor" href="#шаг-2-установка-1"><span>Шаг 2: Установка</span></a></h4>
<ul>
<li>Откройте .pkg-файл (двойной клик).</li>
<li>В окне установщика:
<ul>
<li>Примите лицензию.</li>
<li>Выберите &quot;Continue&quot; &gt; &quot;Install&quot; (введите пароль администратора).</li>
</ul>
</li>
<li>Установка в <code v-pre>/usr/local/go</code> (это GOROOT) займёт 1-2 минуты.</li>
<li>Закройте установщик.</li>
</ul>
<h4 id="шаг-3-настроика-переменных-окружения" tabindex="-1"><a class="header-anchor" href="#шаг-3-настроика-переменных-окружения"><span>Шаг 3: Настройка переменных окружения</span></a></h4>
<ul>
<li>Откройте Terminal (Spotlight: Cmd + Space &gt; Terminal).</li>
<li>Отредактируйте профиль shell:</li>
</ul>
<CodeTabs id="295" :data='[{"id":"zsh"},{"id":"bash"}]' tab-id="shell">
<template #title0="{ value, isActive }">zsh</template>
<template #title1="{ value, isActive }">bash</template>
<template #tab0="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">nano</span> ~/.zshrc</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
<template #tab1="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">nano</span> ~/.bash_profile`</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
</CodeTabs>
<ul>
<li>Добавьте строки:</li>
</ul>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">export GOROOT=/usr/local/go</span>
<span class="line">export GOPATH=$HOME/go</span>
<span class="line">export PATH=$PATH:$GOROOT/bin:$GOPATH/bin</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Сохраните (Ctrl+O &gt; Enter &gt; Ctrl+X в nano).</li>
<li>Примените:</li>
</ul>
<CodeTabs id="323" :data='[{"id":"zsh"},{"id":"bash"}]' tab-id="shell">
<template #title0="{ value, isActive }">zsh</template>
<template #title1="{ value, isActive }">bash</template>
<template #tab0="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">source</span> ~/.zshrc</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
<template #tab1="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">source</span> ~/.bash_profile`</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
</CodeTabs>
<ul>
<li>Перезапустите Terminal.</li>
</ul>
<h4 id="шаг-4-проверка" tabindex="-1"><a class="header-anchor" href="#шаг-4-проверка"><span>Шаг 4: Проверка</span></a></h4>
<ul>
<li>В Terminal:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go version <span class="token comment"># go version go1.23.x darwin/arm64</span></span>
<span class="line">go <span class="token function">env</span> <span class="token comment"># проверь GOROOT и GOPATH</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Создайте тестовый файл <code v-pre>hello.go</code>:</li>
</ul>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token string">"fmt"</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">"Hello, Go!"</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Запустите:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go run hello.go <span class="token comment"># выведет "Hello, Go!"</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h3 id="вариант-2-через-homebrew-для-продвинутых-проще-обновления" tabindex="-1"><a class="header-anchor" href="#вариант-2-через-homebrew-для-продвинутых-проще-обновления"><span>Вариант 2: Через Homebrew (для продвинутых, проще обновления)</span></a></h3>
<ul>
<li>Установите Homebrew: В Terminal выполните:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">/bin/bash <span class="token parameter variable">-c</span> <span class="token string">"<span class="token variable"><span class="token variable">$(</span><span class="token function">curl</span> <span class="token parameter variable">-fsSL</span> https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh<span class="token variable">)</span></span>"</span></span>
<span class="line">brew <span class="token function">install</span> go</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Настройка: Homebrew добавит в PATH автоматически, но добавьте GOPATH как выше.</li>
<li>Обновление:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">brew upgrade go</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h4 id="шаг-5-дополнительная-настроика-1" tabindex="-1"><a class="header-anchor" href="#шаг-5-дополнительная-настроика-1"><span>Шаг 5: Дополнительная настройка</span></a></h4>
<ul>
<li>VS Code: Установите через brew:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">brew <span class="token function">install</span> <span class="token parameter variable">--cask</span> visual-studio-code</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Внутри VS Code установите расширение &quot;Go&quot; (от Google).</li>
<li>Если M1/M2: Убедитесь в arm64-версии.</li>
<li>Проблемы: Если &quot;command not found&quot; — проверьте PATH:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">echo</span> <span class="token environment constant">$PATH</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h2 id="linux" tabindex="-1"><a class="header-anchor" href="#linux"><span>Linux</span></a></h2>
<p>Linux (Ubuntu, Fedora, etc.) — самая гибкая платформа. Инструкции для Debian-based (Ubuntu), но адаптируйте для других (yum/dnf для Fedora, pacman для Arch).</p>
<h3 id="шаг-1-скачивание-1" tabindex="-1"><a class="header-anchor" href="#шаг-1-скачивание-1"><span>Шаг 1: Скачивание</span></a></h3>
<ul>
<li>Откройте браузер или Terminal:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">wget</span> https://go.dev/dl/go1.23.x.linux-amd64.tar.gz <span class="token comment"># для amd64; замените на arm64 если нужно</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Или скачайте вручную с <a href="https://go.dev/dl/" target="_blank" rel="noopener noreferrer">https://go.dev/dl/</a>.</li>
</ul>
<h3 id="шаг-2-установка-2" tabindex="-1"><a class="header-anchor" href="#шаг-2-установка-2"><span>Шаг 2: Установка</span></a></h3>
<ul>
<li>В Terminal: Перейдите в директорию скачивания:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">cd</span> Downloads</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Распакуйте:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> <span class="token function">tar</span> <span class="token parameter variable">-C</span> /usr/local <span class="token parameter variable">-xzf</span> go1.23.x.linux-amd64.tar.gz <span class="token comment"># пароль sudo по умолчанию или ваш</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Это создаст <code v-pre>/usr/local/go</code> (GOROOT).</li>
</ul>
<h3 id="шаг-3-настроика-переменных-окружения-1" tabindex="-1"><a class="header-anchor" href="#шаг-3-настроика-переменных-окружения-1"><span>Шаг 3: Настройка переменных окружения</span></a></h3>
<ul>
<li>Отредактируйте профиль:</li>
</ul>
<CodeTabs id="478" :data='[{"id":"zsh"},{"id":"bash"}]' tab-id="bash">
<template #title0="{ value, isActive }">zsh</template>
<template #title1="{ value, isActive }">bash</template>
<template #tab0="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">nano</span> ~/.zshrc</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
<template #tab1="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">nano</span> ~/.bash_profile`</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
</CodeTabs>
<ul>
<li>Добавьте строки:</li>
</ul>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">export GOROOT=/usr/local/go</span>
<span class="line">export GOPATH=$HOME/go</span>
<span class="line">export PATH=$PATH:$GOROOT/bin:$GOPATH/bin</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Сохраните (Ctrl+O &gt; Enter &gt; Ctrl+X в nano).</li>
<li>Примените:</li>
</ul>
<CodeTabs id="506" :data='[{"id":"zsh"},{"id":"bash"}]' tab-id="bash">
<template #title0="{ value, isActive }">zsh</template>
<template #title1="{ value, isActive }">bash</template>
<template #tab0="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">source</span> ~/.zshrc</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
<template #tab1="{ value, isActive }">
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token builtin class-name">source</span> ~/.bash_profile`</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div></template>
</CodeTabs>
<ul>
<li>Перезапустите Terminal.</li>
</ul>
<h3 id="шаг-4-проверка-1" tabindex="-1"><a class="header-anchor" href="#шаг-4-проверка-1"><span>Шаг 4: Проверка</span></a></h3>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go version <span class="token comment"># go version go1.23.x darwin/arm64</span></span>
<span class="line">go <span class="token function">env</span> <span class="token comment"># проверь GOROOT и GOPATH</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Создайте тестовый файл <code v-pre>hello.go</code>:</li>
</ul>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token string">"fmt"</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token string">"Hello, Go!"</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li>Запустите:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line">go run hello.go <span class="token comment"># выведет "Hello, Go!"</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h4 id="альтернативы-для-дистрибутивов" tabindex="-1"><a class="header-anchor" href="#альтернативы-для-дистрибутивов"><span>Альтернативы для дистрибутивов:</span></a></h4>
<ul>
<li>Ubuntu/Debian:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> update <span class="token operator">&amp;&amp;</span> <span class="token function">sudo</span> <span class="token function">apt</span> <span class="token function">install</span> golang-go <span class="token comment"># но это старая версия; лучше tar.gz для свежей</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Fedora:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> dnf <span class="token function">install</span> golang</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Arch:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> pacman <span class="token parameter variable">-S</span> go</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Snap:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> snap <span class="token function">install</span> go <span class="token parameter variable">--classic</span> <span class="token comment"># для любой дистрибуции</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><h3 id="шаг-5-дополнительная-настроика-2" tabindex="-1"><a class="header-anchor" href="#шаг-5-дополнительная-настроика-2"><span>Шаг 5: Дополнительная настройка</span></a></h3>
<ul>
<li>VS Code:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> <span class="token function">apt</span> <span class="token function">install</span> code</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Внутри VS Code установите расширение &quot;Go&quot; (от Google).</li>
<li>Создайте директорию проектов:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">mkdir</span> <span class="token parameter variable">-p</span> <span class="token variable">$GOPATH</span>/src</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><ul>
<li>Проблемы: Если &quot;permission denied&quot; — проверьте права на <code v-pre>/usr/local/go</code>:</li>
</ul>
<div class="language-bash line-numbers-mode" data-highlighter="prismjs" data-ext="sh"><pre v-pre><code><span class="line"><span class="token function">sudo</span> <span class="token function">chown</span> <span class="token parameter variable">-R</span> <span class="token environment constant">$USER</span> /usr/local/go</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>После установки давай подробнее рассмотрим первую программу.</p>
</div></template>


