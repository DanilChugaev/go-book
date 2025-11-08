# Установка и настройка

## Общая информация

Установка Go — это первый шаг к программированию на этом языке. Go распространяется в виде бинарных дистрибутивов, которые легко установить на большинстве платформ. Процесс включает скачивание, установку, настройку переменных окружения и проверку.

::: info
Инструкции актуальны на ноябрь 2025 года (последняя стабильная версия Go — 1.23.x или новее; проверьте на официальном сайте go.dev для обновлений).
:::

## Рекомендации перед началом:

- Скачивайте с официального сайта: https://go.dev/dl/ (или golang.org/dl/).
- Выберите версию для вашей архитектуры (amd64 для большинства ПК, arm64 для M1/M2 Mac).
- После установки настройте переменные окружения: `GOROOT` (директория установки Go), `GOPATH` (директория для ваших проектов, по умолчанию `~/go`), и добавьте `GOROOT/bin` в `PATH`.
- Для модулей (рекомендуется с Go 1.11+): Используйте `go mod init` в проектах — это упрощает управление зависимостями.
- Если возникнут проблемы, читайте документацию: https://go.dev/doc/install.
- Тестируйте установку командой `go version` в терминале/командной строке.

Теперь разберём по платформам.

## Windows

Windows поддерживает Go хорошо, но настройка переменных окружения требует внимания (используйте GUI или PowerShell). Подходит для Windows 10/11 (64-bit).

### Шаг 1: Скачивание дистрибутива

- Откройте браузер и перейдите на https://go.dev/dl/.
- Найдите раздел "Featured downloads" или прокрутите вниз.
- Выберите файл для Windows: `go1.23.x.windows-amd64.msi` (для 64-bit Intel/AMD) или `go1.23.x.windows-arm64.msi` (для ARM, редко).
- Нажмите "Download" и сохраните файл (размер ~150 MB).

### Шаг 2: Установка

- Запустите скачанный .msi-файл (двойной клик).
- В окне установщика:
  - Примите лицензию (License Agreement) — нажмите "Next".
  - Выберите директорию установки: По умолчанию `C:\Program Files\Go` (рекомендую не менять, это будет GOROOT).
  - Убедитесь, что галочка "Add Go to PATH" стоит (если нет — поставьте).
  - Нажмите "Next" > "Install" и подтвердите UAC (User Account Control), если попросит.
- Дождитесь завершения (1-2 минуты). Нажмите "Finish".

### Шаг 3: Настройка переменных окружения (если не добавилось автоматически)

- Правой кнопкой мыши на "Этот компьютер" (This PC) > "Свойства" (Properties) > "Дополнительные параметры системы" (Advanced system settings) > "Переменные среды" (Environment Variables).
- В разделе "Системные переменные" (System variables):
  - Нажмите "Создать" (New): Имя `GOROOT`, Значение `C:\Program Files\Go` (или ваша директория).
  - Найдите `Path`, нажмите "Изменить" (Edit) > "Создать" (New) и добавьте `%GOROOT%\bin`.
  - Опционально: Создайте `GOPATH` с значением `C:\Users\ВашеИмя\go` (для проектов).
- Нажмите OK для сохранения.
- Перезапустите командную строку (cmd или PowerShell), чтобы изменения применились.

### Шаг 4: Проверка установки

- Откройте командную строку (Win + R > cmd > Enter).
- Выполните:

```bash
go version # должно вывести "go version go1.23.x windows/amd64"
go env # проверьте GOROOT и GOPATH
```

- Создайте тестовый файл `hello.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

- Запустите:

```bash
go run hello.go # выведет "Hello, Go!"
```

### Шаг 5: Дополнительная настройка

- Установите VS Code: Скачайте с code.visualstudio.com. Внутри VS Code установите расширение "Go" (от Google).
- Если проблемы: Проверьте антивирус (может блокировать), или скачайте .zip-версию и разархивируйте вручную в `C:\Go`, затем настройте переменные.

## macOS

macOS (Ventura, Sonoma или новее) поддерживает Go нативно. Можно использовать официальный инсталлер или Homebrew (рекомендую для разработчиков).

### Вариант 1: Официальный инсталлер (простой)

#### Шаг 1: Скачивание

- Перейдите на [https://go.dev/dl/](https://go.dev/dl/).
- Выберите `go1.23.x.darwin-amd64.pkg` (для Intel) или `go1.23.x.darwin-arm64.pkg` (для Apple Silicon M1/M2+).
- Скачайте (размер ~150 MB).

#### Шаг 2: Установка

- Откройте .pkg-файл (двойной клик).
- В окне установщика:
  - Примите лицензию.
  - Выберите "Continue" > "Install" (введите пароль администратора).
- Установка в `/usr/local/go` (это GOROOT) займёт 1-2 минуты.
- Закройте установщик.

#### Шаг 3: Настройка переменных окружения

- Откройте Terminal (Spotlight: Cmd + Space > Terminal).
- Отредактируйте профиль shell:

::: code-tabs#shell
@tab zsh
```bash
nano ~/.zshrc
```

@tab bash
```bash
nano ~/.bash_profile`
```
:::

- Добавьте строки:

```
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

- Сохраните (Ctrl+O > Enter > Ctrl+X в nano).
- Примените: 

::: code-tabs#shell
@tab zsh
```bash
source ~/.zshrc
```

@tab bash
```bash
source ~/.bash_profile`
```
:::

- Перезапустите Terminal.

#### Шаг 4: Проверка

- В Terminal: 

```bash
go version # go version go1.23.x darwin/arm64
go env # проверь GOROOT и GOPATH
```

- Создайте тестовый файл `hello.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

- Запустите:

```bash
go run hello.go # выведет "Hello, Go!"
```

### Вариант 2: Через Homebrew (для продвинутых, проще обновления)

- Установите Homebrew: В Terminal выполните:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install go
```

- Настройка: Homebrew добавит в PATH автоматически, но добавьте GOPATH как выше.
- Обновление: 

```bash
brew upgrade go
```

#### Шаг 5: Дополнительная настройка

- VS Code: Установите через brew:

```bash
brew install --cask visual-studio-code
```

- Внутри VS Code установите расширение "Go" (от Google).
- Если M1/M2: Убедитесь в arm64-версии.
- Проблемы: Если "command not found" — проверьте PATH:

```bash
echo $PATH
```

## Linux

Linux (Ubuntu, Fedora, etc.) — самая гибкая платформа. Инструкции для Debian-based (Ubuntu), но адаптируйте для других (yum/dnf для Fedora, pacman для Arch).

### Шаг 1: Скачивание

- Откройте браузер или Terminal:

```bash
wget https://go.dev/dl/go1.23.x.linux-amd64.tar.gz # для amd64; замените на arm64 если нужно
```

- Или скачайте вручную с [https://go.dev/dl/](https://go.dev/dl/).

### Шаг 2: Установка

- В Terminal: Перейдите в директорию скачивания:

```bash
cd Downloads
```

- Распакуйте: 

```bash
sudo tar -C /usr/local -xzf go1.23.x.linux-amd64.tar.gz # пароль sudo по умолчанию или ваш
```

- Это создаст `/usr/local/go` (GOROOT).

### Шаг 3: Настройка переменных окружения

- Отредактируйте профиль:

::: code-tabs#bash
@tab zsh
```bash
nano ~/.zshrc
```

@tab bash
```bash
nano ~/.bash_profile`
```
:::

- Добавьте строки:

```
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

- Сохраните (Ctrl+O > Enter > Ctrl+X в nano).
- Примените: 

::: code-tabs#bash
@tab zsh
```bash
source ~/.zshrc
```

@tab bash
```bash
source ~/.bash_profile`
```
:::

- Перезапустите Terminal.

### Шаг 4: Проверка

```bash
go version # go version go1.23.x darwin/arm64
go env # проверь GOROOT и GOPATH
```

- Создайте тестовый файл `hello.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
```

- Запустите:

```bash
go run hello.go # выведет "Hello, Go!"
```

#### Альтернативы для дистрибутивов:

- Ubuntu/Debian:

```bash
sudo apt update && sudo apt install golang-go # но это старая версия; лучше tar.gz для свежей
```

- Fedora:

```bash
sudo dnf install golang
```

- Arch:

```bash
sudo pacman -S go
```

- Snap:

```bash
sudo snap install go --classic # для любой дистрибуции
```

### Шаг 5: Дополнительная настройка

- VS Code:

```bash
sudo apt install code
```

- Внутри VS Code установите расширение "Go" (от Google).
- Создайте директорию проектов:

```bash
mkdir -p $GOPATH/src
```

- Проблемы: Если "permission denied" — проверьте права на `/usr/local/go`:

```bash
sudo chown -R $USER /usr/local/go
```

После установки давай подробнее рассмотрим первую программу.
