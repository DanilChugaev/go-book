---
prev: /guide/ci-cd-deploy/practice.md
---

# Рекомендации по коду: CI/CD и деплой

- Автоматизируйте в CI уже работающие локально команды, а не заменяйте ими локальную диагностику.
- Разделяйте unit, integration и Docker build jobs: каждый подтверждает отдельный риск.
- Запускайте integration-тесты только на ephemeral service container и отдельной `*_test` базе.
- Давайте GitHub Actions минимально необходимые permissions: `contents: read` по умолчанию, `packages: write` только publish job.
- Публикуйте и деплойте immutable image по SHA; `latest` оставляйте только как удобную ссылку.
- Никогда не храните passwords, registry tokens и SSH keys в Git, Dockerfile или открытых workflow env.
- На VPS проверяйте SSH host key через known_hosts и используйте отдельного deploy user, а не root.
- Не публикуйте PostgreSQL наружу без отдельной обоснованной и защищённой сетевой конфигурации.
- Проверяйте deployment через быстрый `/healthz`; сохраняйте предыдущий рабочий SHA и регулярно проверяйте rollback.
- Делайте миграции backward-compatible, пока возможен rollback на предыдущий image.

## Чек-лист

Каждый merge проходит статический анализ, unit/race и PostgreSQL integration-тесты, Dockerfile собирается, production получает конкретный SHA image из GHCR, secrets изолированы, deployment проверяется health-check, а rollback не зависит от `latest` и не ломается из-за несовместимой схемы.
