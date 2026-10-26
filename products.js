'use strict';
// Verified official articles; editorial selections are not brand collections.
const PRODUCTS=[
  {
    "id": "25271",
    "sku": "25271",
    "name": "Кресло лаунж Cosmo",
    "officialName": "Кресло лаунж Космо/Cosmo велюр/букле, vt шейп горчичный",
    "cat": "Мягкая мебель",
    "sub": "Кресла",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 23380,
    "priceLabel": "Демонстрационная цена",
    "dims": "71,5 × 84 × 101–107 см",
    "material": "велюр/букле",
    "finish": "VT shape amber",
    "photo": "./assets/products/verified/25271-1.webp",
    "photos": [
      "./assets/products/verified/25271-1.webp",
      "./assets/products/verified/25271-2.webp",
      "./assets/products/verified/25271-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kreslo-launj-cosmo-velyur_bukle-vt-shape-amber.html",
    "desc": "Кресло лаунж Cosmo. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "14318",
    "sku": "14318",
    "name": "Кресло Bremo",
    "officialName": "Кресло Бремо/Bremo (мод. 708) ткань/металл, 58х55х83см, серый бархат 26/черный",
    "cat": "Мягкая мебель",
    "sub": "Кресла",
    "col": "soft",
    "mats": [
      "Ткань",
      "Металл"
    ],
    "mat": "Ткань",
    "price": 8400,
    "priceLabel": "Демонстрационная цена",
    "dims": "58 × 55 × 83 см, высота до сиденья 48 см",
    "material": "ткань/металл",
    "finish": "серый barkhat 26/черный",
    "photo": "./assets/products/verified/14318-1.webp",
    "photos": [
      "./assets/products/verified/14318-1.webp",
      "./assets/products/verified/14318-2.webp",
      "./assets/products/verified/14318-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kreslo-bremo-mod-708-tkan-metall-58h55h83-sm-vysota-do-siden-ya-48-sm-seryy-barkhat-26-chernyy.html",
    "desc": "Кресло Bremo. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "25115",
    "sku": "25115",
    "name": "Кресло Murano",
    "officialName": "Кресло Мурано/Murano опора 360, букле, изумрудный-опал (бетси)",
    "cat": "Мягкая мебель",
    "sub": "Кресла",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 11270,
    "priceLabel": "Демонстрационная цена",
    "dims": "46 × 64 × 88 см",
    "material": "букле",
    "finish": "изумруд-опал (Betsy)",
    "photo": "./assets/products/verified/25115-1.webp",
    "photos": [
      "./assets/products/verified/25115-1.webp",
      "./assets/products/verified/25115-2.webp",
      "./assets/products/verified/25115-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kreslo-murano_murano-opora-360-bukle-izumrudopal-betsy.html",
    "desc": "Кресло Murano. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "25442",
    "sku": "25442",
    "name": "Кресло Relax с пуфом",
    "officialName": "Кресло лаунж Relax/Релакс с пуфом",
    "cat": "Мягкая мебель",
    "sub": "Кресла",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 33600,
    "priceLabel": "Демонстрационная цена",
    "dims": "",
    "material": "велюр/букле (HYP)",
    "finish": "бежевый",
    "photo": "./assets/products/verified/25442-1.webp",
    "photos": [
      "./assets/products/verified/25442-1.webp"
    ],
    "source": "https://secretdemaison.ru/products/kreslo-launj-relax_relaks-s-pufom-velyur_bukle-hyp-bejevyiy.html",
    "desc": "Кресло Relax с пуфом. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": "В официальном поиске две записи одного артикула ведут на один URL; карточка открывается с пустой галереей и нулевыми размерами. Официальный поиск показывает бежевый комплект с пуфом: previewz73155.jpg. Кадр визуально сопоставлен с более качественным FORMA HOME 897/00-main.webp: совпадают силуэт, швы, обивка и взаимное расположение кресла и пуфа. Используется только этот подтверждённый кадр, размеры не публикуются."
  },
  {
    "id": "25186",
    "sku": "25186",
    "name": "Диван Charli Lux",
    "officialName": "Диван Чарли Люкс/Charli Lux велюр/букле, vt шейп какао",
    "cat": "Мягкая мебель",
    "sub": "Диваны",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 23060,
    "priceLabel": "Демонстрационная цена",
    "dims": "118 × 81 × 82 см",
    "material": "велюр/букле",
    "finish": "vt шейп какао",
    "photo": "./assets/products/verified/25186-1.webp",
    "photos": [
      "./assets/products/verified/25186-1.webp",
      "./assets/products/verified/25186-2.webp",
      "./assets/products/verified/25186-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/divan-charli-lux_charli-lyuks-velyur_bukle-vt-shape-wood-rose.html",
    "desc": "Диван Charli Lux. Материал и исполнение приведены по публичной карточке бренда. В описании источника есть расхождение отделки; см. примечание об источнике.",
    "sourceNote": "В заголовке официальной карточки vt шейп какао, в характеристиках VT shape wood rose. В демо сохранён вариант из заголовка; фото взяты непосредственно из галереи SKU25186, расхождение источника не исправлено выдуманными данными."
  },
  {
    "id": "12828",
    "sku": "12828",
    "name": "Диван Retro",
    "officialName": "Диван Ретро/Retro (мод.CD5021) дерево вяз, 112,5х77х85см, груша №3",
    "cat": "Мягкая мебель",
    "sub": "Диваны",
    "col": "natural",
    "mats": [
      "Дерево"
    ],
    "mat": "Дерево",
    "price": 60450,
    "priceLabel": "Демонстрационная цена",
    "dims": "112,5 × 77 × 85 см",
    "material": "дерево вяз",
    "finish": "Груша (№3)",
    "photo": "./assets/products/verified/12828-1.webp",
    "photos": [
      "./assets/products/verified/12828-1.webp",
      "./assets/products/verified/12828-2.webp",
      "./assets/products/verified/12828-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/divan-secret-de-maison-retro-mod-cd5021.html",
    "desc": "Диван Retro. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "25090",
    "sku": "25090",
    "name": "Диван Ergo",
    "officialName": "Диван Эрго/Ergo рогожка, коричневый, 3м7-147",
    "cat": "Мягкая мебель",
    "sub": "Диваны",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 8370,
    "priceLabel": "Демонстрационная цена",
    "dims": "118 × 91 × 99 см",
    "material": "рогожка",
    "finish": "коричневый",
    "photo": "./assets/products/verified/25090-1.webp",
    "photos": [
      "./assets/products/verified/25090-1.webp",
      "./assets/products/verified/25090-2.webp",
      "./assets/products/verified/25090-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/divan-ergo_ergo-rogojka-korichnevyiy-3m7147.html",
    "desc": "Диван Ergo. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "20606",
    "sku": "20606",
    "name": "Обеденный стол Aligery",
    "officialName": "Стол обеденный раздвижной Алигери/Aligery ЛДСП/HPL/опора-массив березы, 130-160х75х75см, мрамор светлый/белый",
    "cat": "Столы",
    "sub": "Обеденные столы",
    "col": "details",
    "mats": [
      "ЛДСП",
      "HPL",
      "Дерево"
    ],
    "mat": "ЛДСП",
    "price": 20940,
    "priceLabel": "Демонстрационная цена",
    "dims": "130 × 75+30 × 75 см",
    "material": "ЛДСП/HPL/опора-массив березы",
    "finish": "Мрамор светлый/белый",
    "photo": "./assets/products/verified/20606-1.webp",
    "photos": [
      "./assets/products/verified/20606-1.webp",
      "./assets/products/verified/20606-2.webp",
      "./assets/products/verified/20606-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stol-aligery-ldsp_hpl_metall-130-h-7530-h-75-sm-mramor-svetlyiy_belyiy.html",
    "desc": "Обеденный стол Aligery. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "25015",
    "sku": "25015",
    "name": "Столик Osteria",
    "officialName": "Стол кофейный/подставка Остерия/Osteria металл, черный, 25,5х25,5х59см",
    "cat": "Столы",
    "sub": "Журнальные столики",
    "col": "details",
    "mats": [
      "Металл"
    ],
    "mat": "Металл",
    "price": 5290,
    "priceLabel": "Демонстрационная цена",
    "dims": "25,5 × 25,5 × 59 см",
    "material": "металл",
    "finish": "черный",
    "photo": "./assets/products/verified/25015-1.webp",
    "photos": [
      "./assets/products/verified/25015-1.webp",
      "./assets/products/verified/25015-2.webp",
      "./assets/products/verified/25015-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kofeynyiy-stol_podstavka-osteria_osteriya-metall-chernyiy-255h255h59-sm.html",
    "desc": "Столик Osteria. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "26065",
    "sku": "26065",
    "name": "Столик Jambi",
    "officialName": "Столик журнальный со стеклом Джамби/Jambi натуральный ротанг, стекло 5мм, натуральный, 55х55х56см",
    "cat": "Столы",
    "sub": "Журнальные столики",
    "col": "natural",
    "mats": [
      "Ротанг",
      "Стекло"
    ],
    "mat": "Ротанг",
    "price": 9440,
    "priceLabel": "Демонстрационная цена",
    "dims": "55 × 55 × 56 см",
    "material": "натуральный ротанг, стекло 5мм",
    "finish": "натуральный",
    "photo": "./assets/products/verified/26065-1.webp",
    "photos": [
      "./assets/products/verified/26065-1.webp",
      "./assets/products/verified/26065-2.webp",
      "./assets/products/verified/26065-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stolik-jurnalnyiy-so-steklom-djambi_jambi-naturalnyiy-rotang-steklo-5mm-naturalnyiy-55h55h56sm.html",
    "desc": "Столик Jambi. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "8301",
    "sku": "8301",
    "name": "Столик Andrea",
    "officialName": "Столик кофейный Андреа/Andrea ротанг, Д60х50см, пекан античн. орех",
    "cat": "Столы",
    "sub": "Журнальные столики",
    "col": "natural",
    "mats": [
      "Ротанг"
    ],
    "mat": "Ротанг",
    "price": 15750,
    "priceLabel": "Демонстрационная цена",
    "dims": "D60 × 50 см",
    "material": "ротанг",
    "finish": "Pecan Washed (античн. орех)",
    "photo": "./assets/products/verified/8301-1.webp",
    "photos": [
      "./assets/products/verified/8301-1.webp",
      "./assets/products/verified/8301-2.webp",
      "./assets/products/verified/8301-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kofeynyy-stolik-andrea-andrea-nat-rotang-pekan.html",
    "desc": "Столик Andrea. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "10085",
    "sku": "10085",
    "name": "Комплект New Bogota",
    "officialName": "Комплект Нью Богота/New Bogota (диван + 2 кресла + стол со стеклом) /с подушками/ ротанг, кр:61х67х78,5см, дв:108х66х78,5см, ст:Д60х56,5см, коричневый кокос",
    "cat": "Готовые комплекты",
    "sub": "Для отдыха",
    "col": "natural",
    "mats": [
      "Ротанг"
    ],
    "mat": "Ротанг",
    "price": 38500,
    "priceLabel": "Демонстрационная цена",
    "dims": "кр: 61 × 67 × 78,5 см, дв: 108 × 66 × 78,5 см, ст: D60 × 56,5 см",
    "material": "ротанг",
    "finish": "coco brown (коричневый кокос)",
    "photo": "./assets/products/verified/10085-1.webp",
    "photos": [
      "./assets/products/verified/10085-1.webp",
      "./assets/products/verified/10085-2.webp",
      "./assets/products/verified/10085-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/komplekt-new-bogota--divan-2-kresla-stol-so-steklom-s-podushkami-rotang-kr-61h67h78-5sm-dv-108h66h78-5sm-st-d60h56-5sm-coco-brown-korichnevyy-kokos-.html",
    "desc": "Комплект New Bogota. Мебельный комплект представлен как один товар. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "20462",
    "sku": "20462",
    "name": "Книжный шкаф Rosewood",
    "officialName": "Книжный шкаф Secret de Maison Росвуд/Rosewood (мод. GK9808-192) массив палисандра, 120х40х192см, натуральный тонированный",
    "cat": "Хранение",
    "sub": "",
    "col": "natural",
    "mats": [
      "Дерево"
    ],
    "mat": "Дерево",
    "price": 185760,
    "priceLabel": "Демонстрационная цена",
    "dims": "120 × 40 × 192 см",
    "material": "палисандр",
    "finish": "Natural tinted (натуральный тонированный)",
    "photo": "./assets/products/verified/20462-1.webp",
    "photos": [
      "./assets/products/verified/20462-1.webp",
      "./assets/products/verified/20462-2.webp",
      "./assets/products/verified/20462-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/knijnyiy-shkaf-secret-de-maison-rosewood--mod-gk9808192--palisandr-12040192-sm-natural-tinted-naturalnyiy-tonirovannyiy.html",
    "desc": "Книжный шкаф Rosewood. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "25947",
    "sku": "25947",
    "name": "Кресло Fluffy",
    "officialName": "Кресло Флаффи/Fluffy опора 360, вельвет, бежевый",
    "cat": "Мягкая мебель",
    "sub": "Кресла",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 13500,
    "priceLabel": "Демонстрационная цена",
    "dims": "71 × 70 × 93 см",
    "material": "вельвет",
    "finish": "бежевый",
    "photo": "./assets/products/verified/25947-1.webp",
    "photos": [
      "./assets/products/verified/25947-1.webp",
      "./assets/products/verified/25947-2.webp",
      "./assets/products/verified/25947-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/kreslo-flaffi_fluffy-opora-360-velvet-bejevyiy.html",
    "desc": "Кресло Fluffy. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "26190",
    "sku": "26190",
    "name": "Стул Casa",
    "officialName": "Стул обеденный Каса/Casa велюр/букле, светло-серый, HYP 07",
    "cat": "Стулья",
    "sub": "Обеденные стулья",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 5590,
    "priceLabel": "Демонстрационная цена",
    "dims": "52 × 64 × 93 см",
    "material": "велюр/букле",
    "finish": "светло-серый, HYP 07",
    "photo": "./assets/products/verified/26190-1.webp",
    "photos": [
      "./assets/products/verified/26190-1.webp",
      "./assets/products/verified/26190-2.webp",
      "./assets/products/verified/26190-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stul-obedennyiy-kasa_casa-velyur_bukle-svetloseryiy-hyp-07.html",
    "desc": "Стул Casa. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "24906",
    "sku": "24906",
    "name": "Полубарный стул Bari",
    "officialName": "Стул полубарный Бари/Bari велюр, серый, 29, 42х55х99см",
    "cat": "Стулья",
    "sub": "Полубарные стулья",
    "col": "soft",
    "mats": [
      "Ткань"
    ],
    "mat": "Ткань",
    "price": 4910,
    "priceLabel": "Демонстрационная цена",
    "dims": "42 × 55 × 99 см",
    "material": "велюр",
    "finish": "серый",
    "photo": "./assets/products/verified/24906-1.webp",
    "photos": [
      "./assets/products/verified/24906-1.webp",
      "./assets/products/verified/24906-2.webp",
      "./assets/products/verified/24906-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/polubarnyiy-stul--bari_bari-velyur-seryiy-29-42h55h99-sm.html",
    "desc": "Полубарный стул Bari. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "11378",
    "sku": "11378",
    "name": "Комплект Waltz of Flowers",
    "officialName": "Комплект Secret de Maison Вальс Цветов/Waltz of Flowers (стол+2 стула) алюминиевый сплав, D60/H67, 47х41х86см, бронзовый",
    "cat": "Готовые комплекты",
    "sub": "Обеденные комплекты",
    "col": "details",
    "mats": [
      "Металл"
    ],
    "mat": "Металл",
    "price": 16760,
    "priceLabel": "Демонстрационная цена",
    "dims": "D60/H67, 47 × 41 × 86 см",
    "material": "алюминиевый сплав",
    "finish": "бронза/bronze",
    "photo": "./assets/products/verified/11378-1.webp",
    "photos": [
      "./assets/products/verified/11378-1.webp",
      "./assets/products/verified/11378-2.webp",
      "./assets/products/verified/11378-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/komplekt-secret-de-maison-vals-cvetov-waltz-of-flowers-stol-2-stula-bronza.html",
    "desc": "Комплект Waltz of Flowers. Мебельный комплект представлен как один товар. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "13068",
    "sku": "13068",
    "name": "Стол Cindy Glass",
    "officialName": "Стол обеденный Синди Гласс/Cindy Glass (мод.80GLASS) металл/стекло, прозрачный, Д80х75см",
    "cat": "Столы",
    "sub": "Обеденные столы",
    "col": "details",
    "mats": [
      "Металл",
      "Стекло"
    ],
    "mat": "Металл",
    "price": 8260,
    "priceLabel": "Демонстрационная цена",
    "dims": "D80 × 75 см",
    "material": "металл/стекло",
    "finish": "прозрачный",
    "photo": "./assets/products/verified/13068-1.webp",
    "photos": [
      "./assets/products/verified/13068-1.webp",
      "./assets/products/verified/13068-2.webp",
      "./assets/products/verified/13068-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stol-cindy-glass-mod-80glass-metall-steklo-d80h75sm-prozrachnyy.html",
    "desc": "Стол Cindy Glass. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  },
  {
    "id": "15860",
    "sku": "15860",
    "name": "Столик Bloom",
    "officialName": "Столик кофейный Secret de Maison Блум/Bloom (мод. 11873-B) алюминиевый сплав, 46х46х51см, черный/золотой",
    "cat": "Столы",
    "sub": "Журнальные столики",
    "col": "details",
    "mats": [
      "Металл"
    ],
    "mat": "Металл",
    "price": 9400,
    "priceLabel": "Демонстрационная цена",
    "dims": "46 × 46 × 51 см",
    "material": "алюминиевый сплав",
    "finish": "чёрный / золотой",
    "photo": "./assets/products/verified/15860-1.webp",
    "photos": [
      "./assets/products/verified/15860-1.webp",
      "./assets/products/verified/15860-2.webp",
      "./assets/products/verified/15860-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stolik-kofeynyiy-secret-de-maison-bloom--mod-11873b--alyuminievyiy-splav-464651-sm-chernyiy_antichnaya-med.html",
    "desc": "Столик Bloom. Материал и исполнение приведены по публичной карточке бренда. В описании источника есть расхождение отделки; см. примечание об источнике.",
    "sourceNote": "Заголовок официальной карточки: чёрный/золотой; характеристика и URL: чёрный/античная медь. В демо отделка из заголовка, кадры непосредственно из галереи SKU15860. Точный оттенок требует уточнения у бренда."
  },
  {
    "id": "15859",
    "sku": "15859",
    "name": "Столик Fendy",
    "officialName": "Столик кофейный Secret de Maison Фенди/Fendy (мод. 11980) алюминиевый сплав/мрамор, черный/белый мрамор, 38*38*53 см",
    "cat": "Столы",
    "sub": "Журнальные столики",
    "col": "details",
    "mats": [
      "Металл",
      "Мрамор"
    ],
    "mat": "Металл",
    "price": 8000,
    "priceLabel": "Демонстрационная цена",
    "dims": "38 × 38 × 53 см",
    "material": "алюминиевый сплав/мрамор",
    "finish": "черный/белый мрамор",
    "photo": "./assets/products/verified/15859-1.webp",
    "photos": [
      "./assets/products/verified/15859-1.webp",
      "./assets/products/verified/15859-2.webp",
      "./assets/products/verified/15859-3.webp"
    ],
    "source": "https://secretdemaison.ru/products/stolik-kofeynyiy-secret-de-maison-fendy--mod-11980--alyuminievyiy-splav_mramor-383853-sm-antichnaya-med.html",
    "desc": "Столик Fendy. Материал и исполнение приведены по публичной карточке бренда. ",
    "sourceNote": ""
  }
];
const COLLECTIONS={
  "soft": {
    "title": "Мягкие формы",
    "sub": "Редакционная подборка",
    "text": "Кресла, диваны и стулья с тактильной обивкой. Подборка демонстрационного проекта, не коллекция бренда."
  },
  "natural": {
    "title": "Природные фактуры",
    "sub": "Редакционная подборка",
    "text": "Древесина и ротанг: выразительные материалы для спокойного интерьера. Редакционный выбор проекта."
  },
  "details": {
    "title": "Графика деталей",
    "sub": "Редакционная подборка",
    "text": "Стекло, металл и ритм линий. Редакционный взгляд на предметы, объединённые характером, а не официальной серией."
  }
};
