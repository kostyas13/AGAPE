# AGAPE Rénovation — agaperenovation.fr

Статический трёхъязычный сайт (FR — корень, EN — `/en/`, RU — `/ru/`), 18 страниц.
Никакой сборки не требуется: обычные HTML + CSS + JS, работает на любом хостинге.

## Структура

```
index.html, services.html, a-propos.html,          ← французская версия (основная)
realisations.html, journal.html, contact.html
en/  index, services, about, projects, journal, contact
ru/  index, services, o-nas, proekty, zhurnal, kontakty
assets/style.css   — все стили (дизайн + лоадер)
assets/site.js     — лоадер, курсор, меню, шапка
sitemap.xml, robots.txt, favicon.svg
_archive/          — старый React-скелет (можно удалить)
```

## Запуск локально

```
python -m http.server 5173
```
и открыть http://localhost:5173 (или через launch-конфиг `agape-static`).

## Экран загрузки

Анимация чертежа (как в Loader-1c.dc.html) встроена в главные страницы каждого
языка, проигрывается **один раз за сессию** (sessionStorage `agapeLoader`).
Длительность: `--loader-dur` в `assets/style.css` (сейчас 5.6s).
При `prefers-reduced-motion` лоадер отключается автоматически.

## Что заменить, когда придут ассеты

1. **Фото героя** — в `index.html` (каждого языка) у `.hero` добавить
   `style="background-image:url('assets/img/hero.jpg')"` и удалить
   `.hero-placeholder-label`.
2. **Проекты** — заменить `.sketch-placeholder` / ячейки `.works-grid` на
   `<img>` с реальными фото (обязательно с `alt` с ключевыми словами и городом).
3. **Статьи журнала** — карточки-заглушки заменить на реальные статьи
   (каждая статья = отдельная страница, добавить в sitemap.xml).

## TODO (важно)

- **Форма контактов** подключена через FormSubmit на agapebatiment@yahoo.com.
  ⚠ После деплоя нужно отправить форму один раз — FormSubmit пришлёт на
  agapebatiment@yahoo.com письмо с ссылкой активации, кликнуть её. До активации
  заявки не доставляются.
- После деплоя: отправить `sitemap.xml` в Google Search Console и указать
  сайт в Google Business Profile.

## SEO (уже встроено)

- Schema.org `GeneralContractor` (LocalBusiness) на каждой странице:
  NAP — AGAPE Renovation, 18 Rue Arson, 06300 Nice, +33 7 83 54 61 83,
  гео-координаты, часы Пн–Пт 8:00–17:00, SIREN 909 278 780, зоны обслуживания.
- `BreadcrumbList` на подстраницах, hreflang fr/en/ru + x-default,
  canonical, Open Graph, sitemap.xml с языковыми альтернативами, robots.txt.
- Семантика: один `h1` на страницу, иерархия h2/h3, `<nav>/<main>/<footer>`.

NAP на сайте должен всегда совпадать с Google Business Profile — при смене
телефона/адреса менять в обоих местах.
