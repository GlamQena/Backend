const mongoose = require("mongoose");
const Product = require("../models/product"); 
const categoryModel = require("../models/category");
const {storeOwnerModel} = require("../models/users/storeOwner");

const path = require("path");
require("dotenv").config({path: path.join(__dirname, "../.env")});
const fs = require("fs");

let seedData = [
  //skincare products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "تونر مرطب حليبي",
    description: "تونر الترطيب الحليبي HYDRO-FILLER، يتكون من حمض الهيالورونيك والكولاجين لتنظيف البشرة. يساعد في إزالة أي بقايا بعد التنظيف. ينقي خلايا البشرة ويقلل من حجم المسام ليترك الوجه بملمس ومظهر أكثر نعومة.",
    price: 293,
    stock: 20,
    ingredients: [
      "حمض الهيالورونيك",
      "كولاجين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZFA3275ECA27344C7AD3BZ/45/1765455958/6a7d16b8-a82a-470a-aff0-405f30ab6fe9.jpg",
      "https://f.nooncdn.com/p/pzsku/ZFA3275ECA27344C7AD3BZ/45/1765455958/a6c8afb4-3672-439d-bcc5-cfec9c5c8090.jpg",
      "https://f.nooncdn.com/p/pzsku/ZFA3275ECA27344C7AD3BZ/45/1765455958/2ffb4884-dd58-4dfd-b403-02f6a29d7e09.jpg"
    ],
    skinType: "عادية",
    weight: 0.15,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "تونر وجه كولاجرا فيتامين سي",
    price: 122,
    description: "تونر الوجه كولاجرا فيتامين سي هو منتج متعدد الاستخدامات يفي بعدة وظائف، حيث يعمل على تفتيح البشرة، شد المسام، وإزالة المكياج، كل ذلك مع التحكم في إفراز الزيوت الزائدة. غني بمضادات الأكسدة القوية، فهو يجهز بشرتك للحصول على بشرة صافية ومشرقة.",
    stock: 15,
    ingredients: [
      "فيتامين سي",
      "مضادات أكسدة"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZA52E4E5BDC434186192FZ/45/_/1773771402/5a54954a-e2cd-4c8f-a6da-05a85ae5d976.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZA52E4E5BDC434186192FZ/45/_/1773771459/5f34f06c-a46b-4592-bc88-949542d9c449.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZA52E4E5BDC434186192FZ/45/_/1773771459/9e05e8b1-688f-4bcc-95c0-0bba2e4b2665.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "غسول كولاجرا بفيتامين ب3",
    price: 105,
    description: "منظف كولاجرا للبشرة الدهنية (200 مل) ينظف الزيوت الزائدة ويفتح المسام بفضل تركيبته القوية من فيتامين B3، حمض الساليسيليك، الشاي الأخضر، والمات مارين. تركيبته اللطيفة توازن البشرة ومثالية للاستخدام اليومي، لتترك البشرة منتعشة وخالية من الجفاف.",
    stock: 12,
    ingredients: [
      "فيتامين ب3",
      "حمض الساليسيليك",
      "شاي أخضر",
      "مات مارين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z5284974711075D810976Z/45/_/1778944673/c7149de8-9fd3-41ca-b7ab-eb79697abc24.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z5284974711075D810976Z/45/_/1778944674/1771d124-862a-4d53-bf0e-f951aa33e1c4.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "منظف أليجون",
    price: 260,
    description: "منظف البشرة الدهنية اليجون بحمض الجليكوليك وزيت شجرة الشاي - 200 مل (قد يختلف التغليف)",
    stock: 10,
    ingredients: [
      "حمض الجليكوليك",
      "زيت شجرة الشاي"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZFBAFF7632CBEEE253136Z/45/_/1777452275/fea2510c-037a-44c4-b457-dca1b01a5ed4.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZFBAFF7632CBEEE253136Z/45/1757776715/ffb241d1-3a11-4e4a-a0dd-804695a8518d.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZFBAFF7632CBEEE253136Z/45/_/1777452275/04d46e85-4f52-4e29-8165-186b7620cb95.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "تونر حمض الجليكوليك",
    price: 207,
    description: "محلول تونر تيرسوس هو تونر للعناية بالبشرة مقشر، يحتوي على 8% من حمض الجليكوليك (AHA) لمساعدة على إزالة خلايا الجلد الميتة، وتحسين نسيج البشرة، وزيادة الإشراقة العامة. يعزز بشرة أكثر نعومة وإشراقًا مع المساعدة على تقليل مظهر الخطوط الدقيقة، وتفاوت لون البشرة، والبهتان. مناسب للاستخدام ضمن روتين العناية بالبشرة اليومي للحصول على بشرة منتعشة ومتجددة.",
    stock: 8,
    ingredients: [
      "حمض الجليكوليك"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZB53C9B544E6CDFC8D204Z/45/_/1782149444/710dd56b-d558-41e2-8c51-858ab5b11bf1.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.15,
    volume: 220,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "سيروم سنتيلا مرطب -1",
    price: 180,
    description: "الاستخدام اليومي لمظهر طبيعي وصحي، الاستخدام اليومي للبشرة الحساسة لتهدئة وتلطيف البشرة",
    stock: 25,
    ingredients: [
      "سنتيلا",
      "جليسرين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z4B65FC4DD0876AF32178Z/45/_/1785761669/724b5885-3fa4-4d42-ab09-9d995869577c.jpg?width=800"
    ],
    skinType: "حساسة",
    weight: 0.05,
    volume: 30,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "غسول جاميرا",
    price: 150,
    description: "غسول التفتيح جيميرا برايت ووايت مُصمّم خصيصًا للبشرة الحساسة. غني بفيتامين C، وفيتامين B3، وحمض اللاكتيك، والبروبوليس، يقوم بتنظيف البشرة بلطف، ويقضي على الروائح، ويوازن مستويات الحموضة، ويُضيء البشرة الداكنة. هذه التركيبة الخالية من البارابين تضمن الانتعاش اليومي مع الحفاظ على حاجز الرطوبة الطبيعي لبشرتك ومكافحة البكتيريا الضارة.",
    stock: 20,
    ingredients: [
      "فيتامين سي",
      "فيتامين ب3",
      "حمض اللاكتيك",
      "البروبوليس"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z581C700BD5CC4D4AB29AZ/45/1754937646/59330913-0a01-4af3-a3fd-455ed2c459e1.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z581C700BD5CC4D4AB29AZ/45/1754937690/139cd1d7-519c-40bd-a422-7170df0c49a4.jpg?width=800"
    ],
    skinType: "حساسة",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "غسول نورماديرم",
    price: 688,
    description: "جيل التنظيف المنقي يومي فيتشي نورماديرم فِيتوسوليوشن هو غسول يومي ينقي ويعطي حيوية للبشرة الدهنية المعرضة للشوائب. يزيل الشوائب بشكل مثالي مثل الأوساخ والغبار وجزيئات الملوثات، مع تنظيف المسام المسدودة والرؤوس السوداء، بحيث تشعر البشرة بالنظافة وتبدو أكثر نضارة وصفاء وخالية من اللمعان. في غضون شهر واحد فقط، تظهر الرؤوس السوداء أقل وضوحًا وتبدو المسام غير مسدودة. مناسب للبشرة الحساسة. مختبر جلديًا. منخفض التحسس. غني بمكونات فعالة مثل حمض الساليسيليك وزنك الغلوكونات، في قاعدة تنظيف من أصل نباتي. فعال سريريًا ضد زيادات الزيوت.",
    stock: 15,
    ingredients: [
      "حمض الساليسيليك",
      "زنك غلوكونات"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZFC87052AF7C659D3AC9BZ/45/_/1779345615/dd76a728-faec-49e0-be07-6e5c2da8a654.jpg",
      "https://f.nooncdn.com/p/pzsku/ZFC87052AF7C659D3AC9BZ/45/_/1779345616/881059f7-b671-4bd7-87c7-31ae9c061cd8.jpg",
      "https://f.nooncdn.com/p/pzsku/ZFC87052AF7C659D3AC9BZ/45/_/1779345615/9f76a82d-4f2c-4bc8-bd78-3ed2f5dd744e.jpg"
    ],
    skinType: "دهنية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "جيل ستارفيل",
    price: 210,
    description: "جل تنظيف الوجه من ستارفيل (400 مل) هو منظف يومي منعش وفعّال مصمم ليترك بشرتك صافية ومتوازنة ونظيفة براحة. تركيبته اللطيفة لكن القوية تزيل الأوساخ والشوائب والزيوت الزائدة وبقايا المكياج دون أن تجرد البشرة من رطوبتها الطبيعية، مما يجعله مناسبًا لجميع أنواع البشرة، بما في ذلك البشرة الحساسة.قوام الجل يخلق رغوة ناعمة وخفيفة تنتشر بسهولة على الوجه، وتوفر إحساسًا مهدئًا ومنعشًا مع كل غسلة. غني بمكونات مرطبة ومهدئة، يساعد على الحفاظ على مستويات الرطوبة ويترك البشرة ناعمة وملساء ومنتعشة.مثالي للاستخدام صباحًا ومساءً، هذا المنظف يدعم روتين العناية بالبشرة الصحي من خلال المساعدة في التحكم في اللمعان ومنع تراكم الأوساخ وتعزيز بشرة مشرقة ونضرة. الحجم الكبير 400 مل يوفر استخدامًا طويل الأمد وقيمة ممتازة، مما يجعل جل تنظيف الوجه من ستارفيل خيارًا موثوقًا لمن يسعى لبشرة نظيفة ومتوهجة ومتوازنة يوميًا.",
    stock: 30,
    ingredients: [
      "جليسرين",
      "مستخلصات مرطبة"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z9F7E420C872753569CC7Z/45/1761733524/465d75b2-2f54-4b36-8944-c1188e836521.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z9F7E420C872753569CC7Z/45/1762523697/f79fc11f-4672-415a-ba60-c688f3daa761.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z9F7E420C872753569CC7Z/45/1762523697/87ec098d-6cfd-4a8c-8b7c-9e2d871bc841.jpg?width=800"
    ],
    skinType: "مختلطة",
    weight: 0.5,
    volume: 400,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "ديرماسي منظف الوجه",
    price: 266,
    description: "منظف الوجه الرغوي يفتح المسام وينقي البشرة بفعالية دون أن يزيل الزيوت الطبيعية منها. في مختبرات ديرماسي نؤمن بقوة التركيبة. هذا المنظف الرغوي للوجه غني بمزيج من بانثينول وجلسرين ليمنحك تنظيفًا عميقًا، ويزود بشرتك أيضًا بأعلى مستويات الترطيب.",
    stock: 20,
    ingredients: [
      "بانثينول",
      "جليسرين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z2B6D377BD7332AC6E565Z/45/_/1715514886/1a7aa6de-05b0-4c36-8f28-b743246652c7.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2B6D377BD7332AC6E565Z/45/_/1715515007/e8b3d204-411a-4a2b-bb93-ded0ef5b19dc.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2B6D377BD7332AC6E565Z/45/_/1715515027/8d2d0cfd-fdfa-4066-ad43-6f01eedc1448.jpg?width=800"
    ],
    skinType: "جافة",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "منظف سباير كليرسال المضاد لحب الشباب",
    price: 198,
    description: "جل منظف تم اختباره من قبل أطباء الجلد، ومصمم بمزيج من أحماض AHA (حمض الجليكوليك) وBHA (حمض الساليسيليك) لتقشير البشرة بلطف، وتنظيف المسام، وتقليل البثور. غني بزيت شجرة الشاي والسيتريميد للمساعدة في التحكم بنمو الميكروبات، بينما تحافظ النباتات المهدئة على راحة البشرة دون جفاف.",
    stock: 25,
    ingredients: [
      "حمض الجليكوليك",
      "حمض الساليسيليك",
      "زيت شجرة الشاي",
      "سيتريميد"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZAB2AFCB7EBFBA2A4BC14Z/45/_/1786940453/9cdb2657-8be9-43ca-8961-7477a2aae159.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZAB2AFCB7EBFBA2A4BC14Z/45/_/1786940453/3b2a90f1-09f8-46df-b8b7-d39a7fbdd789.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZAB2AFCB7EBFBA2A4BC14Z/45/_/1786940453/c04c900c-5a99-45de-bc7c-1b5210a35a86.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "منظف مهدئ د. إلفيش سيكا",
    price: 235,
    description: "غسول كريمي لطيف مُصمَّم خصيصًا للبشرة الحساسة والمتهيجة أو للعناية بعد العلاجات. مثالي بعد الليزر، التقشير، حروق الشمس، أو الديرمابلانينج. غني بسيكا (سديلة الآسيوية) المهدئة ونباتات مضادة للالتهابات.",
    stock: 12,
    ingredients: [
      "سيكا",
      "مستخلصات نباتية مهدئة"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z0967190CCB095B644527Z/45/_/1734179208/1c637ccd-e10a-4451-82d2-58ffbe9217e6.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z0967190CCB095B644527Z/45/_/1733663269/bb2bd9d4-d5a9-4410-af70-dd7b28551258.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z0967190CCB095B644527Z/45/_/1733663309/ac5397ca-37a8-45d6-b62b-be60eb369f7d.jpg?width=800"
    ],
    skinType: "حساسة",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "كريم مرطب بحمض الهيالورونيك",
    price: 420,
    description: "كريم CeraVe المرطب يحتوي على ثلاثة سيراميدات أساسية وحمض الهيالورونيك لترطيب البشرة بفعالية واستعادة الحاجز الواقي للبشرة. تم تطويره بالتعاون مع أطباء الجلدية ومناسب للبشرة الجافة والجافة جدًا على الوجه والجسم، هذا الكريم الغني والغير دهني وماسح سريع الامتصاص يحتوي على تقنية MVE الحصرية لدينا لإطلاق مكونات الترطيب بشكل مستمر على مدار اليوم والليل. بينما يمكن أن يؤدي ضعف حاجز البشرة إلى الجفاف والحكة، يمكن أن يساعد كريم مرطب يحتوي على حمض الهيالورونيك والسيراميدات. من خلال ترطيب البشرة واستعادة حاجزها الطبيعي، يمكن لكريم بهذه المكونات أن يساعد حتى أصحاب البشرة الجافة جدًا على تحسين مظهر بشرتهم والشعور بها. كريم CeraVe المرطب مع السيراميدات خالٍ من العطور. مناسب للاستخدام للرجال والنساء. آمن للأطفال من عمر شهرين فما فوق.",
    stock: 15,
    ingredients: [
      "حمض الهيالورونيك",
      "سيراميدات",
      "جليسرين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZB7A0F7CD9D36851D2A87Z/45/_/1779179138/457bd44f-3865-4b9e-883e-65988bf71af9.jpg",
      "https://f.nooncdn.com/p/pzsku/Z35013FF4846F7406876CZ/45/_/1779179162/0120e202-d051-40ec-84fc-42d0a3cf8041.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z35013FF4846F7406876CZ/45/_/1779179162/d6802472-c0dc-483d-bba9-4b022acff531.jpg?width=800"
    ],
    skinType: "جافة",
    weight: 0.3,
    volume: 50,
    dimensions: { length: 15, width: 10, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "كريم بلانكي للأطفال المرطب",
    price: 350,
    description: "مرطب متخصص لجميع أنواع بشرة الأطفال، لطيف ومغذي",
    stock: 20,
    ingredients: [
      "جليسرين",
      "زبدة الشيا"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z135AC115E204C722D149Z/45/_/1778650611/48323c68-2f3f-4b67-b2ad-de3b1b3a79e0.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z135AC115E204C722D149Z/45/_/1778650611/132044da-188d-47c2-a889-f9844176cc75.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z135AC115E204C722D149Z/45/_/1778650612/e05b608b-09d5-4cc6-999e-eb8f2583222e.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.2,
    volume: 50,
    dimensions: { length: 15, width: 10, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "جل تنظيف لطيف أكتي-كلير",
    price: 544,
    description: "جل ديرمايل للتنظيف اللطيف هو تركيبة خالية من الصابون ولا تسبب الجفاف، صُممت خصيصًا للبشرة المختلطة إلى الدهنية، وتعمل على إزالة الشوائب بفعالية مع تنظيم إنتاج الزهم. من أول استخدام، يترك البشرة نقية وناعمة ومرطبة—مهيأة تمامًا لتلقي العناية الجلدية الإضافية.",
    stock: 10,
    ingredients: [
      "جليسرين",
      "بانثينول"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZFD991CF2AF0B322AEAA5Z/45/_/1775709344/b654622c-2fc5-4dd9-a5c7-ca7556c25f5e.jpg"
    ],
    skinType: "مختلطة",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "ليلك جل مرطب",
    price: 515,
    description: "مرطب ليلاك جل هو مستحضر خفيف جدًا وغير دهني يمنح ترطيبًا عميقًا وطويل الأمد دون أن يثقل البشرة. تركيبته الجل المنعشة تمتص فورًا، لتترك بشرتك ناعمة وممتلئة ومرطبة تمامًا مع لمسة نهائية خفيفة.",
    stock: 12,
    ingredients: [
      "حمض الهيالورونيك",
      "جليسرين"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z6265197F4BD1BF0BF2DBZ/45/1755358187/8f03393d-3da0-44ef-9ec3-33ab4f4e86fe.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z6265197F4BD1BF0BF2DBZ/45/1755358187/7ce34b5c-07fb-4687-9199-55d511b1c9ae.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z6265197F4BD1BF0BF2DBZ/45/1755358868/3be6efe4-cf6b-474b-a98e-1000421b53f7.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.2,
    volume: 50,
    dimensions: { length: 15, width: 10, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "سِيش كريم مضاد للشيخوخة",
    price: 450,
    description: "كريم سِيش الفعّال ضد الشيخوخة يعمل كغذاء للبشرة. إنه كريم مرطب غني بالمغذيات يعمل على تغذية البشرة وانتعاش صحتها. يوفر ترطيبًا طويل الأمد ونضارة لإعطاءك ثقة أكبر. يحتوي هذا الكريم على 1.5% من نوعين من حمض الهيالورونيك لترطيب مكثف وحبس الرطوبة، بالإضافة إلى مزيج من ثلاث بروتينات مهمة وثلاثة فيتامينات أساسية توفر جميع العناصر الغذائية اللازمة لتقوية البشرة. تساعد هذه المجموعة من المكونات في تجديد البشرة وانعاشها، وتقليل ظهور الخطوط الدقيقة والتجاعيد، مما يمنح البشرة ثباتًا ومظهرًا أكثر شبابًا.",
    stock: 18,
    ingredients: [
      "حمض الهيالورونيك",
      "بروتينات",
      "فيتامينات"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z4CAD336877AF66836543Z/45/1767807833/a9c19405-1c86-489d-8239-872ddd354e4d.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z4CAD336877AF66836543Z/45/_/1672912684/f4f43beb-b492-4729-925e-df44a0dccd84.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z4CAD336877AF66836543Z/45/_/1672912684/dc2196bc-f682-435c-866f-fef34ae091e0.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.3,
    volume: 50,
    dimensions: { length: 15, width: 10, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "منظف لتفتيح البشرة shine&white",
    price: 390,
    description: "منظف شاين آند وايت فوم هو الحل المثالي لتفتيح وتوحيد لون بشرتك، حيث يحتوي على مستخلص توت الدب ومستخلص العرقسوس، اللذين يعملان على توحيد اللون وتحسين ملمس البشرة. مناسب لجميع أنواع البشرة. الوصف: ° يحتوي على مستخلص توت الدب: الذي يساعد على تفتيح البشرة وله خصائص قابضة لتماسك البشرة وتقليل ظهور المسام. ° يحتوي على النياسيناميد والبانثينول، مما يقوي حاجز البشرة ويعمل كمهدئ وملطف للبشرة. ° للحصول على أفضل النتائج، استخدميه يوميًا مع سيروم شاين آند وايت. ° رغوة 200 مل. الفوائد: 1- تفتيح وتوحيد لون البشرة والتخلص من البقع الداكنة والبنية. 2- مضاد للالتهابات وله خصائص مهدئة للبشرة. 3- الاستخدام اليومي لتنظيف البشرة. 4- تقشير لطيف بفضل حمض اللاكتيك. 5- ترطيب عميق وتقوية حاجز البشرة. التحذيرات: - لا تستخدم على البشرة المعرضة لحب الشباب. - للاستخدام الخارجي فقط. - يحفظ في مكان بارد وجاف بدرجة حرارة لا تتجاوز 30م.",
    stock: 15,
    ingredients: [
      "مستخلص توت الدب",
      "مستخلص العرقسوس",
      "نياسيناميد",
      "بانثينول",
      "حمض اللاكتيك"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZE968D418ADF387F3BBCDZ/45/_/1786470900/63bd7545-5df4-4826-a3f2-5f7d362985c2.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE968D418ADF387F3BBCDZ/45/_/1737805296/4b553423-b406-4e51-85b9-fccdbaf15a1a.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE968D418ADF387F3BBCDZ/45/_/1786470912/b60d6689-f31b-446e-a329-00a0b1132603.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.25,
    volume: 200,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "سيروم ناتافيس فيتامين ب3",
    price: 410,
    description: "تقليل حب الشباب: ينظم إنتاج الزهم بفعالية، مما يمنع انسداد المسام وظهور الحبوب. تهدئة البشرة: يخفف الاحمرار والتهيج، ويعزز لون بشرة أكثر تساويًا. خصائص مضادة للشيخوخة: يحسن تجديد خلايا البشرة، مما يقلل من ظهور الخطوط الدقيقة والتجاعيد. تقليل حجم المسام: يساعد على شد وتقليل مظهر المسام الواسعة للحصول على بشرة أكثر نعومة. ترطيب عميق: يضمن حمض الهيالورونيك ترطيبًا طويل الأمد، ويعمل على تحسين مرونة البشرة وامتلائها. تقوية حاجز البشرة: يقوي الحاجز الوقائي الطبيعي للبشرة، مما يجعلها أكثر قدرة على مقاومة الضغوط الخارجية.",
    stock: 10,
    ingredients: [
      "فيتامين ب3",
      "حمض الهيالورونيك"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z9FB1065CD56ABC75F2E4Z/45/_/1778941344/b840e453-9ce2-4b81-aa42-e964b1a74703.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z9FB1065CD56ABC75F2E4Z/45/_/1778941344/894a3150-9e80-4361-9c40-3ccace3ae2ad.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z9FB1065CD56ABC75F2E4Z/45/_/1778941344/a6b10441-d0ed-4533-904a-5df5a704df61.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.05,
    volume: 30,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69db",
    name: "سيروم ديرمايل المتقدم",
    price: 520,
    description: "سيروم ديرمايل 10% نياسيناميد المتقدم هو تركيبة قوية من الدرجة الاحترافية تتحكم بشكل فعال في الزيوت، تقلل من حجم المسام الكبيرة، وتخفف علامات حب الشباب العنيدة بقوة مضاعفة. مُعزز بمستخلصات السنتيلا والعرقسوس المهدئة، يوفر نتائج سريعة وملموسة مع الحفاظ على أمان البشرة—مثالي للمستخدمين المتقدمين الراغبين في تحسين روتين العناية بالبشرة الخاص بهم.",
    stock: 8,
    ingredients: [
      "نياسيناميد",
      "سنتيلا",
      "مستخلص العرقسوس",
      "زنك",
      "بانثينول"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z7AC6FA5ABB541ACCDA33Z/45/_/1786623172/adf13af5-363e-4b78-9e60-7eb73651b593.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7AC6FA5ABB541ACCDA33Z/45/_/1786623202/3b5783f8-ed26-4b28-94d4-a2726835616d.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7AC6FA5ABB541ACCDA33Z/45/_/1786623202/b585c237-b08a-416f-b7d8-de0f5c976df8.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.05,
    volume: 30,
    dimensions: { length: 15, width: 5, height: 5 }
  },
  //makeup products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "ماسكارا L'Oréal Paris Volume",
    description: "ابقِ أنيقة وجميلة مع ماسكارا فوليومينوس بارادايس الخفيفة للغاية. مع ماسكارا فوليومينوس بارادايس، ستشعر رموشك بأنها ناعمة كالريش بدون أي تقشر. تركيبته الناعمة الملمس تغطي رموشك بزيت الخروع المغذي للرموش. مع فرشاة فائقة النعومة، يتم تغطية كل رمش من الجذر حتى الأطراف للحصول على نتائج متساوية. اختبري أقصى درجات الراحة مع هذه الماسكارا سهلة الاستخدام والحمل؛ مثالية لمجموعة مكياجك.​​ لوريال باريس ليست مجرد علامة تجميل، إنها علامة تمكن النساء من التعرف على قيمتهن الحقيقية. وبفضل 110 أعوام من البحث العلمي والابتكار، تقدم لوريال باريس مجموعة كاملة من منتجات التجميل المتقدمة للغاية مع فعالية وسلامة مثبتة إكلينيكيًا.",
    price: 274.0,
    stock: 100,
    ingredients: [
      "ماء",
      "شمع العسل",
      "أكاسيد الحديد",
      "شمع الكرنوبا",
      "زيت الخروع"
    ],
    images: [
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1767607849/2e12186c-73d9-498e-9ba8-f30eedac154c.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1764235323/191b0752-84a6-406e-a01b-0864a2af8cef.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1764235326/bebf4e12-e21b-4531-9577-bceb3af542ad.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1764235328/054e48d2-1651-4b47-a919-bbaa7269dd6b.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1764235325/52307482-d984-484f-a6c4-5d0396e04525.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13159486A/45/_/1764235327/f6519d05-c76a-4ead-b87a-b974a2bce0b8.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.2,
    volume: 9,
    dimensions: { length: 10, width: 5, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "بودرة نود نيشن",
    description: "بودرة تثبيت فائقة النعومة من Nude Nation، مصممة لتثبيت المكياج وإبقاء بشرتك طبيعية وخالية من اللمعان. تركيبتها الخفيفة والشفافة تتحكم في الزيوت طوال اليوم بدون ما تثقل على البشرة. درجة Soft Pink تعطي لمسة من الإشراقة والنضارة، لتخلي بشرتك تبدو صحية ومشرقة. مناسبة لكل أنواع البشرة، وتوفر تغطية قابلة للبناء من خفيفة إلى متوسطة.",
    price: 259.0,
    stock: 50,
    ingredients: [
      "تلك",
      "ميكا",
      "سيليكا",
      "فيتامين E",
      "نشا الذرة"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1773320164/2094a127-500a-4f3e-a260-e0aeb97e147e.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1775554255/170ec1de-459b-4908-94a0-9bf1e4a7cd27.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1775554228/5e0a2027-b4af-450b-b038-42ca4ab31c16.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1775554299/2f96ae2a-c026-4cbf-b405-1693e4555d8f.jpg?width=800"
    ],
    skinType: "دهنية",
    weight: 0.3,
    volume: 25,
    dimensions: { length: 8, width: 8, height: 5 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "بودرة تثبيت مضيئة Bubblegum",
    description: "بودرة تثبيت ناعمة جدًا بلون الوردي، مصممة لإعطاء البشرة الفاتحة إشراقة فورية ومظهر مشرق ومنتعش. تركيبتها بدون تالك تمتص الزيوت الزائدة وتتحكم باللمعان، بينما تعمل جزيئاتها العاكسة للضوء على تنعيم المسام والخطوط الدقيقة. تثبت المكياج لساعات طويلة وتترك لمسة نهائية غير لامعة وناعمة كالحرير. مناسبة لجميع أنواع البشرة وتوفر تغطية خفيفة يمكن زيادتها. اللون الوردي يمنح البشرة نضارة رائعة، مما يجعلها خيار مثالي للبشرة الفاتحة.",
    price: 405.05,
    stock: 75,
    ingredients: [
      "ميكا",
      "فلوروفلوجوبيتات اصطناعية",
      "ستيرات المغنيسيوم",
      "ثنائي الميثيكون",
      "فيتامين E"
    ],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z7E6C05153736F7F05379Z/45/_/1779094038/558f6184-945c-4365-8c0c-a7cd4595eee9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7E6C05153736F7F05379Z/45/_/1779094038/516c9802-2c50-4320-ab02-26102e1e0fdc.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7E6C05153736F7F05379Z/45/_/1779094038/2936494f-9725-48e5-b862-f10b0d666aa9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7E6C05153736F7F05379Z/45/_/1779094038/fc883318-63be-4201-8216-bcf2ef3e8871.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.25,
    volume: 20,
    dimensions: { length: 7, width: 7, height: 2 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "Extreme Shine Volume Lipgloss",
    description: "لمعان شفاه فائق الجودة من essence يمنحك حجمًا ممتلئًا وإشراقة رائعة تدوم طويلاً. تركيبة هذا اللمعان الخفيفة غير اللاصقة تنزلق على شفتيك بسلاسة، لتمنحك لونًا جذابًا ولمعانًا مميزًا دون أي شعور بالثقل. يحتوي على تأثير مكثف يمنح شفتيك امتلاءً فوريًا ويحافظ على ترطيبها طوال اليوم. درجة Glazed Berry هي مزيج مثالي من اللون الحيوي واللمعان، لتضفي على شفتيك إطلالة عصرية وجريئة تناسب جميع ألوان البشرة. تركيبة نباتية، خالية من القسوة، وخالية من الزيوت والجلوتين، مما يجعلها خيارًا مثاليًا لعشاق الجمال الواعي.",
    price: 225.15,
    stock: 120,
    ingredients: [
      "بوليبيوتين",
      "بولي إيزوبوتين هيدروجين",
      "نكهة",
      "فيتامين E",
      "زيت جوز الهند"
    ],
    images: [
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852042/f1352b6c-006e-4ffe-b64b-6ec238fdbd12.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852031/486d2e84-d939-403e-a8be-b29af0c2ce34.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852043/c4efd28b-936a-44a8-a460-3d813f6aafcd.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.1,
    volume: 10,
    dimensions: { length: 12, width: 2, height: 2 }
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "أحمر شفاه Superstay Matte Ink",
    description: "مثالي بشكل مكثف، مكثف بشكل مثالي. لون شفاهك حتى 16 ساعة من لمسة مطفية مشبعة مع أحمر الشفاه السائل مايبيلين نيويورك سوبر ستاي ميت إنك™. هذا أحمر الشفاه السائل عالي الصبغة يقدم شفاه مطفية 100٪ بدون تشققات، بدون جفاف، وبدون انتقال—يحافظ على لونك طوال اليوم. المطبّق الفريد على شكل سهم يضمن تطبيقًا دقيقًا وسهلاً للحصول على لمسة نهائية خالية من العيوب تدوم طويلاً. الظل 80 Ruler يقدّم لونًا جريئًا وأنيقًا مثاليًا للبشرات المتوسطة. الصيغة فائقة التشبع توفر لونًا مكثفًا لا يتلاشى، لتظل شفاهك زاهية وجميلة من الصباح حتى الليل. مايبيلين هي العلامة التجارية رقم 1 عالميًا في المكياج، مستوحاة من المدينة ومختبرة في شوارعها.",
    price: 635.0,
    stock: 80,
    ingredients: [
      "إيزودوديكان",
      "دايميثيكون",
      "تريميثيل سيلوكسيسيليكات",
      "دايميثيكون كروس بوليمر",
      "فينيل دايميثيكون",
      "كوارتز-18"
    ],
    images: [
      "https://f.nooncdn.com/p/v1607410004/N29782178A_3.jpg?width=800",
      "https://f.nooncdn.com/p/v1628077872/N29782178A_2.jpg?width=800",
      "https://f.nooncdn.com/p/v1607410003/N29782178A_6.jpg?width=800",
      "https://f.nooncdn.com/p/v1607410003/N29782178A_7.jpg?width=800",
      "https://f.nooncdn.com/p/v1607410004/N29782178A_8.jpg?width=800",
      "https://f.nooncdn.com/p/v1607410004/N29782178A_9.jpg?width=800"
    ],
    skinType: "عادية",
    weight: 0.15,
    volume: 7,
    dimensions: { length: 12, width: 2, height: 2 }
  },
  //hair care products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "حمام كريم بزبدة الشيا",
    description: "امنحي شعرك العناية التي يستحقها مع ماسك الشعر بزبدة الشيا من سكاي هيربال كير – الحل الأمثل للشعر الجاف والتالف الذي يحتاج إلى تغذية عميقة وترطيب مكثف. غني بزبدة الشيا النقية، هذه التركيبة الكريمية الغنية تخترق عمق الشعر لترطيب من الجذور حتى الأطراف، مسببة لشعرك ملمسًا حريريًا ونعومة طبيعية ولمعان رائع بعد كل استخدام. يعيد الحيوية للشعر التالف نتيجة التصفيف أو الحرارة أو العلاجات الكيميائية، وفي نفس الوقت يقوي الخصلات ويقلل من التكسر وتساقط الشعر. الحجم الكبير بوزن 1 كغ يجعله مثاليًا للاستخدام المنزلي الطويل ويوفر قيمة مميزة. آمن لجميع أنواع الشعر، بما في ذلك الشعر المصبوغ والحساس، هذا الماسك خالي من الكبريتات والمواد الكيميائية الضارة. يغذي وينعش الشعر بعمق، ليمنحك شعرًا صحيًا، ناعمًا، سهل التسريح مع لمعة جميلة كل يوم.",
    price: 66.0,
    stock: 100,
    ingredients: ["زبدة الشيا", "زيت الأرجان", "فيتامين E"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z5A23B7C58971BC5A1D60Z/45/_/1776862582/27e1a0e9-7483-4f37-a904-ef3b14c2efd8.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z5A23B7C58971BC5A1D60Z/45/_/1776862645/2c9a4942-cd38-4890-99ad-921a732ac0aa.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z5A23B7C58971BC5A1D60Z/45/_/1776862645/53e87266-97fe-4428-8ac3-f9b5832976ab.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z5A23B7C58971BC5A1D60Z/45/_/1776862645/b479411c-f856-4c9c-8a20-75df3f41efbd.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z5A23B7C58971BC5A1D60Z/45/_/1776862645/9bd48622-73a8-429b-adce-1a42eb13a104.jpg?width=800",
    ],
    weight: 1.0, // 1 kg from product specification
    volume: null, // Not applicable for hair mask (solid/cream product)
    dimensions: { length: 15, width: 15, height: 10 }, // Adjusted for 1kg container
    skinType: "جافة", // For dry and damaged hair
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "قناع شعر Clary Procapil",
    description: "قوّي شعرك من الجذور حتى الأطراف مع ماسك الشعر كلاري، المُعزز بالبروكا بيل وزبدة الشيا. تركيبة قوية صُممت لإصلاح الشعر التالف، وتقليل التكسر، وزيادة كثافة الشعر بشكل ملحوظ للحصول على مظهر أكثر امتلاءً وصحة. حجم 300 مل مثالي للاستخدام المنتظم، ويوفر تغذية وحماية مكثفة لاستعادة حيوية ولمعان شعرك الطبيعي.",
    price: 285.0,
    stock: 60,
    ingredients: ["بروكابيل", "زبدة الشيا", "كيراتين"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z95A7A81A10D76F2062C5Z/45/_/1707400707/945ba4c7-229a-4e47-96ef-93b90fca55ad.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283084/3d8245c2-5a2f-4827-aed6-6b3db5252d7f.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283085/d0f2886b-11ee-49fc-9a6c-d367feb560cc.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283085/e8f390a7-3462-482c-9edd-fc3b1e095456.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283085/ba86caa8-0a79-4dea-a3dd-0bc91ac14f60.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283085/5689ee81-f161-4d36-9437-fb44e61a1abc.jpg?width=800",
    ],
    weight: 0.4, // Approximate weight for 300ml cream
    volume: 300, // 300ml from product name
    dimensions: { length: 10, width: 10, height: 8 },
    skinType: "جافة", // For dry and damaged hair
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "شامبو سيريه إكسبيرت Absolut Repair",
    description: "مشبع بالكينوا الذهبية والبروتين، تركيبة شامبو الفورمة الاحترافي Instant Resurfacing تنظف الشعر التالف فورًا وتعيده إلى بنيته الطبيعية، مع لمسة خفيفة. هذه التركيبة المتطورة تصلح الشعر بنسبة 77%، وتستعيد قوته وحيويته الطبيعية. يصبح الشعر لامعًا وناعمًا 7 مرات أكثر، مع لمسة ناعمة وحريرية تدوم. حجم 500 مل مثالي للاستخدام المنتظم، مما يجعله خيارًا اقتصاديًا للحفاظ على شعر صحي وجميل. مناسب لجميع أنواع الشعر ولكلا الجنسين، هذا الشامبو هو الحل الأمثل للشعر الجاف والتالف الذي يحتاج إلى عناية مكثفة.",
    price: 1406.43,
    stock: 30,
    ingredients: ["بروتين الكينوا الذهبية", "بروتين", "بانثينول"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z2BCB76B5CA4941CB98D6Z/45/_/1773139599/a26cf76f-5b0d-4395-a210-035f0a8a8fca.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2BCB76B5CA4941CB98D6Z/45/_/1773139599/6228c134-650e-47b7-9543-0e2c1ca48ad9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2BCB76B5CA4941CB98D6Z/45/_/1773139599/7c918f94-befe-4b36-89d3-d4d0a8b4b71b.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2BCB76B5CA4941CB98D6Z/45/_/1773139599/fb4a1c13-2810-463a-b005-d90729d52ca9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z2BCB76B5CA4941CB98D6Z/45/_/1773139599/2744827e-506f-40af-a526-b5e29e70e2c0.jpg?width=800",
    ],
    weight: 0.55, // Approximate weight for 500ml liquid
    volume: 500, // 500ml from specifications
    dimensions: { length: 9, width: 9, height: 22 }, // Taller bottle for shampoo
    skinType: "جافة", // For dry and damaged hair
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "كريم Leaves لتغذية وتصفيف الشعر ضد التجعد",
    description: "حوّل شعرك مع كريم الشعر المغذي والمرتب من Leaves، تركيبة مضادة للتطاير غنية بالأعشاب الهندية. هذا الكريم العلاجي مصمم لإصلاح الشعر وتغذيته وتصفيفه مع مكافحة تساقطه وتقليل التكسر. يعمل على ترطيب عميق لاستعادة النعومة واللمعان والملمس الناعم، مما يجعل شعرك أكثر سهولة في التسريح ومظهراً صحياً. الكريم يُترك على الشعر ويسهل تطبيقه، ومثالي للاستخدام اليومي.",
    price: 198.0,
    stock: 50,
    ingredients: ["مستخلص الأعشاب الهندية", "زبدة الشيا", "زيت جوز الهند"],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZE6A7CE3068B8B8FC0F3EZ/45/1764161906/fff8e597-0556-4ac9-ba38-4983207e6e54.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE6A7CE3068B8B8FC0F3EZ/45/1764161906/6e1737de-c0ff-4918-a4fb-6206cb01e62d.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE6A7CE3068B8B8FC0F3EZ/45/_/1773409353/bf985fbe-f785-4a05-b819-ba4e456f57f5.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE6A7CE3068B8B8FC0F3EZ/45/_/1773409353/176dff9d-4d8b-4842-9e6b-26419ba7ee20.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZE6A7CE3068B8B8FC0F3EZ/45/_/1773409353/ddb7e5be-9c36-4506-bb8c-04bf88ce60f2.jpg?width=800",
    ],
    weight: 0.25, // Approximate weight for 200ml cream
    volume: 200, // 200ml from product name
    dimensions: { length: 16, width: 5, height: 4 },
    skinType: "عادية", // Suitable for all hair types
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "SKINOVA IMAGE سيروم شعر",
    description: "استعيدي لمعان شعرك ونعومته وحيويته مع سيروم الشعر من سكينوفا، صيغة خفيفة مصممة لتغذية الشعر وحمايته من التلف اليومي. غني بمكونات متقدمة لتكييف الشعر، يساعد هذا السيروم على التحكم في التجعد وتقليل الجفاف ويترك الشعر يبدو حريرياً وصحياً وأسهل في التصفيف. قوامه غير الدهني ويمتص بسرعة ليغطي كل خصلة ويمنح نعومة فورية ولمعان طبيعي دون أن يثقل الشعر. مناسب لجميع أنواع الشعر، يساعد على الحماية من حرارة التصفيف والضغوطات البيئية مع تحسين ملمس الشعر بشكل عام. مع الاستخدام المنتظم، يعزز سيروم الشعر من سكينوفا النعومة ويضيف اللمعان ويمنح شعرك مظهراً مصقولاً يشبه صالونات التجميل كل يوم.",
    price: 230.0,
    stock: 90,
    ingredients: ["بروتين القمح", "سايكلوميثيكون", "دايميثيكونول"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z14B791B48111A9B28B5EZ/45/_/1786905581/5a919ada-ea6d-4106-ad38-ddc18e96507f.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z14B791B48111A9B28B5EZ/45/_/1777296250/3ed484f2-e997-45b0-a61c-f80cf92fa603.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z14B791B48111A9B28B5EZ/45/_/1777296250/c50dca3d-3c4b-4ddc-b653-43d50be5547f.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z14B791B48111A9B28B5EZ/45/_/1777296250/b39c1d3a-d0ba-4357-8abc-3045d62c99e8.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z14B791B48111A9B28B5EZ/45/_/1777296250/6b5e79e7-690c-4766-8375-4078d207873a.jpg?width=800",
    ],
    weight: 0.15, // Lightweight serum bottle
    volume: 100, // Typical serum size (estimated from image)
    dimensions: { length: 5, width: 5, height: 12 },
    skinType: "عادية", // Suitable for all hair types
  },
  //men's grooming products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "بلسم بعد الحلاقة Nivea Men",
    description: "قم بتهدئة وراحة تهيج الحلاقة فورًا مع بلسم ما بعد الحلاقة المنعش للرجال من نيفيا للبشرة الحساسة. تم صياغته خصيصًا للبشرة الحساسة، هذا البلسم الخالي من الكحول يمنح إحساسًا بالبرودة لطيفًا وطويل الأمد بدون لسعة الحرق المعتادة للبلسمات التقليدية. غني بمستخلص البابونج والأعشاب البحرية، يهدئ الاحمرار والتهيجات بلطف ويحمي البشرة من أضرار الحلاقة. مع الوقت، يحسن حالة البشرة ويخفف الجفاف وينعشها لتصبح ناعمة وصحية. حجم 100 مل مثالي للاستخدام اليومي، مما يجعله جزءًا أساسيًا من روتين العناية الشخصية لكل رجل. نيفيا للرجال—يبدأ كل شيء معك!",
    price: 241.8,
    stock: 80,
    ingredients: ["مستخلص البابونج", "مستخلص الأعشاب البحرية", "جليسرين", "بانثينول"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242457/ca558377-459e-4b29-baf4-3ceee1f04e02.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242459/e52451be-c0c7-4abc-9d5e-4636c4de5d29.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242460/6bfc864d-67ca-4f7f-9b31-6a9fcd4824a7.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242461/56047fa9-cca3-41f9-9999-8f55938d6d18.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242462/b39bd918-5df4-4d58-a3dc-ebdb174bedc5.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242462/5a521789-616f-4101-b437-790850c3b4e5.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292856A/45/_/1764242458/60cb68e4-49c9-4437-98ea-fee1c3d6fcfd.jpg?width=800"
    ],
    weight: 0.15, // 100ml cream/balm
    volume: 100, // 100ml from description
    dimensions: { length: 8, width: 5, height: 12 },
    skinType: "حساسة", // Specially formulated for sensitive skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "مضاد التعرق Deep DarkWood",
    description: "مضاد التعرق NIVEA MEN DEEP هو تركيبة فريدة تم تطويرها لإبعاد العرق ورائحة الجسم، وترك بشرتك جافة ونظيفة. تم تطويره كتركيبة مضادة للبكتيريا مع الكربون الأسود، يوفر مضاد التعرق NIVEA MEN Deep حماية موثوقة ضد التعرق لمدة 48 ساعة ويعمل بشكل قوي ضد البكتيريا ليمنحك جفافًا طويل الأمد مع شعور بالنظافة بعد الاستحمام. في NIVEA، لدينا مجموعة واسعة من الصابون، جل الاستحمام، إضافات الحمام، مزيلات العرق، الكريمات، اللوشنات، الحليبات والكثير غيرها. إذا كنت تبحث عن منتجات تساعد في تحسين المظهر الصحي أو إشراقة بشرتك، فنحن نوفر لك ما تحتاجه! ألقِ نظرة الآن واكتشف منتج NIVEA المثالي لاحتياجاتك وتفضيلاتك. لدينا منتجات للرجال والنساء بما في ذلك مستلزمات الحلاقة ومزيلات العرق لجميع متطلباتك الشخصية للعناية بالنظافة. NIVEA MEN، البداية تكون منك!",
    price: 70.7,
    stock: 150,
    ingredients: ["كلوروهيدرات الألومنيوم", "الكربون الأسود", "زيت الأفوكادو"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N39790177A/45/_/1767607812/c7e66898-f9e5-4ce4-8734-d4eb8f1a5230.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N15767861A/45/_/1766585081/4156b4cc-fc54-4094-b51a-fdf354472cd2.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z6E1E006BC8EE20290DFDZ/45/_/1783866720/af3619fe-1574-42aa-8556-c1d7ceaa919f.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z6E1E006BC8EE20290DFDZ/45/_/1783866720/4793f8dc-e619-48d4-89f8-29045115dae9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z6E1E006BC8EE20290DFDZ/45/_/1783866720/99ce31a7-0851-4dc9-9962-877f8473ab24.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N15767861A/45/_/1766585081/cad3fbd5-0063-4a2b-a996-ee421b8d40e6.jpg?width=800",
    ],
    weight: 0.1, // Standard deodorant stick/roll-on
    volume: 50, // Typical deodorant size (estimated)
    dimensions: { length: 4, width: 4, height: 10 },
    skinType: "عادية", // Suitable for normal skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "حمام جل Hydra Sport",
    description: "العلامة الرياضية الحقيقية للرجال والنساء، adidas Body Care تفتح لك إمكاناتك الكاملة مع جل الاستحمام adidas Hydra Sport 3in1. بفضل تقنية 3in1 المبتكرة، يوفر هذا الجل المتعدد الاستخدامات عناية كاملة لجميع مناطق الجسم الثلاثة الرئيسية. ينقي وينظف الوجه، ويزيل الدهون الزائدة لبشرة صحية وخالية من اللمعان. ينظف ويرطب الشعر، ويجدد فروة الرأس ويزيل التراكمات. ومع تركيبته غير المسببة للجفاف، يرطب وينظف الجسم، تاركًا بشرتك منتعشة ومريحة. غني بمركب Moisturize+ الفريد، يرطب البشرة فورًا ويخفف من الجفاف والشدة، بينما يتركك عطر Fougere الشرقي المهدئ تشعر بالراحة والانتعاش بعد كل استحمام. مجرب من قبل أطباء الجلد ومتوازن الحموضة، مناسب للاستخدام اليومي. استعد. افتح إمكاناتك الكاملة.",
    price: 207.4,
    stock: 100,
    ingredients: ["مرطب +", "عطر فواجير شرقي", "جليسرين", "بانثينول"],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZF6009BB1F8D14AF80FA6Z/45/_/1779789848/d3a9203e-c96b-423e-a1e4-f5b1d8682c0c.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF6009BB1F8D14AF80FA6Z/45/_/1779789848/93f11481-5563-4f5b-9da2-93e771fc38bb.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF6009BB1F8D14AF80FA6Z/45/_/1779789848/08f074d3-91d1-41ac-8e30-154a09318861.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF6009BB1F8D14AF80FA6Z/45/_/1779789848/85a65d87-9970-4c76-87dd-41b01d3d7105.jpg?width=800",
    ],
    weight: 0.28, // 250ml liquid product
    volume: 250, // 250ml from specifications
    dimensions: { length: 5, width: 5, height: 18 },
    skinType: "حساسة", // For sensitive skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "برفان Defy",
    description: "قوي. متحدي. مثير. عطر كالفن كلاين ديفاي بارفوم الجديد للرجال مخصص للمتمرد النهائي—أكثر جرأة من أي وقت مضى. هذا العطر المميز من CK للرجال يحمل نفس الحمض النووي الخشبي المميز، لكنه مع لمسة دافئة وأغمق بشكل غير متوقع وجذاب. انفجار من البرتقال اليوسفي وزيت الهيل مع الخزامى وقشرة الكاكاو يخلق رائحة جديدة قوية ومغرية. يفتتح العطر بنفحة مشرقة ومضيئة من الفلفل الوردي، يليه قلب من الخزامى الطبيعي الذي يضيف لمسة منعشة وعطرية. في القاعدة، تضيف قشرة الكاكاو المعاد تدويرها والمستوردة بمسؤولية عمقًا غنيًا وحلوًا، برائحة رائعة حقًا. صُمم لتجسيد رموز تصميم كالفن كلاين البسيطة والوحيدة اللون، الزجاجة الفاخرة تتميز بزجاج أزرق داكن وغطاء أزرق غير لامع وملمسه محكم. التعبئة والتغليف هي احتفال برموز علامة CK—مرتفع، بسيط، وفاخر للغاية. أكثر جرأة وثقة من أي وقت مضى، يحتضن رحلته في التحدي بشكل كامل.",
    price: 83.6,
    stock: 120,
    ingredients: ["زيت البرتقال اليوسفي", "زيت الهيل", "اللافندر", "قشر الكاكاو", "الفلفل الوردي", "الفيتيفر", "خشب الصندل"],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/7e7f055f-4f86-4b76-b194-215ab725b009.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/0eae0b9f-646a-4e3c-b109-f4fbad3ade5e.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/b7f3b13c-ac52-424b-8971-6970d19a1ce7.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/ca07279d-c04e-44a6-b4ea-36e025bd748c.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/bc587d63-1941-4c6e-a2d9-4a2ea47b51eb.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/0b6d00c1-f971-4296-b176-523c1badde30.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF0DFB5E1F4823E4B112AZ/45/_/1779704280/98a7999e-e1f4-49a8-b823-f60ab8d396bd.jpg?width=800"
    ],
    weight: 0.25, // 100ml glass perfume bottle
    volume: 100, // 100ml from specifications
    dimensions: { length: 7, width: 4, height: 18 },
    skinType: "عادية", // Suitable for normal skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "رذاذ جسم مزيل للعرق Black",
    description: "قدّم بيانًا من خلال احتضان قوة التهذيب مع بخاخ الجسم AXE Black للرجال. كجزء من مجموعة العناية بالرجال الجديدة من AXE Black، يتميز هذا البخاخ برائحة خفيفة وراقية للرجال لا تحتاج للصراخ لتُسمع صوتها. مع نفحات عليا من البرغموت المنعش ممزوجًا بإكليل الجبل الطازج وخشب الأرز المريح، تقدّم هذه الرائحة عبيرًا خشبيًا متطورًا للرجال الذين يفضلون الثقة الهادئة. رذاذات قليلة تكفي على الإبطين والصدر لتترك انطباعًا يدوم. قد يختلف التغليف.",
    price: 130.0,
    stock: 70,
    ingredients: ["كحول إيثيلي", "عطر", "البرغموت", "إكليل الجبل", "خشب الأرز"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1781438454/e3b03810-ec75-44a5-829c-542b64fe326c.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1781438454/48f63bec-dcae-494b-81ac-841f52fe1dc5.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1732554658/c74ae40d-06ed-4394-8c26-7565b5cf21e6.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1732554677/92650568-fd63-4dd1-af68-fc68d1b31266.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1732554659/d40e3724-4a68-496c-8274-40c51f230a76.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1732554661/1301e231-35a7-4d5a-9d3a-5ac8158d55be.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N31470600A/45/_/1732554665/baa6d706-1219-41de-a221-c3209d866e47.jpg?width=800"
    ],
    weight: 0.15, // 150ml aerosol spray
    volume: 150, // 150ml from product name
    dimensions: { length: 5, width: 5, height: 15 },
    skinType: "عادية", // Suitable for normal skin
  },
  //body care products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "غسول جسم مغذي بعمق",
    description: "غسول الجسم المرطب هذا يجمع بين NutriumMoisture والمنظفات اللطيفة لمساعدة بشرتك على الحفاظ على رطوبتها الطبيعية، ليمنحك بشرة ناعمة وملساء. تركيبة العناية في هذا الغسول من دوف تساعد على الحفاظ على حاجز الرطوبة في بشرتك وتغذيها بعمق في طبقاتها السطحية. يرطب بشرتك ويترك رغوة غنية وكريمية، ليشعرك بالعناية والنظافة والانتعاش. يحتوي على مزيج متوازن بعناية من المنظفات اللطيفة ومكونات الترطيب، وصُمم خصيصًا للبشرة الجافة. يمنحك تغذية مكثفة لبشرة أكثر نعومة وملمسًا بعد أول استحمام. مُختبر من قبل أطباء الجلد ومتوازن الحموضة (pH)، الحجم 500 مل مثالي للاستخدام اليومي، ليكون جزءًا أساسيًا من روتين العناية ببشرتك. دوف—عناية حقيقية لبشرة حقيقية.",
    price: 183.0,
    stock: 50,
    ingredients: ["جليسرين", "كوكاميدوبروبيل بيتين", "حمض دهني", "نخيلات الصوديوم", "حمض اللوريك"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N20457540A/45/_/1767607803/343309ee-d77b-42ba-a39d-166dd7d7a5ca.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N20457540A/45/_/1764242370/d0fac174-07ea-42f2-a305-7596946bdf8a.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N20457540A/45/_/1764242369/763aa481-75e3-4e3c-83bf-286e2fc8a537.jpg?width=800",
    ],
    weight: 0.55, // 500ml liquid product
    volume: 500, // 500ml from description
    dimensions: { length: 8, width: 8, height: 20 },
    skinType: "جافة", // Specially formulated for dry skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "جيل زيت الجسم فازلين Cocoa Radiant",
    description: "هل تبحثين عن منتج يجمع بين الترطيب العميق، النعومة المخملية، والتوهّج الجذاب؟ استعيدي إشراقة بشرتك مع زيت الجسم فازلين (نقي 100%) — ترطيب عميق بدون أثر دهني! تركيبة مبتكرة تجمع بين فعالية فازلين وتقنية الزيوت المجددة، لتقدم تجربة عناية مميزة للجسم تعزز الأنوثة وتوفر ترطيبًا عميقًا. تركيبة الزيت-جيل سريعة الامتصاص لا تترك أثراً دهنيًا مزعجًا، بينما يعيد فيتامين E تغذية وتنشيط بشرتك. وبفضل قطرات فازلين جيلي، يحتفظ الزيت بالرطوبة، مستعيدًا الحيوية والمرونة للبشرة الجافة. يترك بشرتك متوهجة وناعمة كالحرير، مما يجعلها مثالية للاستخدام اليومي ولحظات التدليل الخاصة. غني بالزيوت الطبيعية التي تساعد على استعادة إشراق البشرة المتعبة، هذا هو زيت الجسم الأمثل للنساء اللواتي يردن بشرة مشرقة ومرطبة وجميلة كل يوم.",
    price: 275.0,
    stock: 3,
    ingredients: ["زيت معدني", "فيتامين E", "زيت جوز الهند", "زبدة الكاكاو"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010380/d2301411-e676-4512-9412-b7ac58926b4b.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010322/d8b643b3-aa26-4a88-8be2-c1cf09c1de46.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010322/c19e24f0-1983-4150-987f-6cb8ef5a00ec.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010380/ec9bd35f-2499-48d1-a7af-1608da941f02.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010380/d3c4b7a5-1675-4d93-9d6a-7d77089971a8.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010380/9792a617-2fdf-4d07-afca-1169da1a6254.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z64FDE5E02435D1E52650Z/45/_/1773010380/9974a446-e420-4a8e-a407-46bb1fa31efe.jpg?width=800"
    ],
    weight: 0.22, // 200ml oil-gel product
    volume: 200, // 200ml from specifications
    dimensions: { length: 5, width: 5, height: 15 },
    skinType: "جافة", // For dry skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "زيت جاف متعدد الاستخدامات",
    description: "زيت فافيلين متعدد الاستخدامات للبشرة الجافة هو علاج مرطب للوجه والجسم والشعر — معجزة حقيقية مصممة بمزيج فريد من فيتامين E وسبعة زيوت نباتية ثمينة. يشمل هذا المزيج الأسطوري زيت تسوباكي، وزيت الأرجان، وزيت المكاديميا، وزيت البرواريج، وزيت الكاميليا، وزيت البندق، وزيت اللوز الحلو، التي تعمل معًا لتغذية بشرتك وشعرك من الداخل إلى الخارج. تركيبة الزيت الجاف خفيفة الوزن وغير دهنية تمتص بسرعة، وتوفر ترطيبًا مكثفًا وتترك وجهك وشعرك وجسمك بتوهج مشرق طالما حلمت به. مثالي لجميع أنواع البشرة والشعر، هذا الزيت متعدد الاستخدامات بحجم 50 مل هو الحل الشامل للتغذية واللمعان المثالي.",
    price: 3450.0,
    stock: 2,
    ingredients: ["زيت التوباكي", "زيت الأرجان", "زيت المكاديميا", "زيت لسان الثور", "زيت الكاميليا", "زيت البندق", "زيت اللوز الحلو", "فيتامين E"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z663C1AA12574E3E631B0Z/45/_/1775914577/10f775b5-0204-4e07-9cee-1eda3ff9005d.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z663C1AA12574E3E631B0Z/45/_/1775914611/99c503c3-9e1c-45b3-bbb6-6d3b6f6edc15.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z663C1AA12574E3E631B0Z/45/_/1775914611/1b09aebe-0931-4b9e-b22c-c0b635126801.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z663C1AA12574E3E631B0Z/45/_/1775914612/36753967-945c-4313-bd80-1bf9ed4bc33b.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z663C1AA12574E3E631B0Z/45/_/1775914611/2a4d3d48-c6c3-4b12-a6c7-51a1b3e76053.jpg?width=800",
    ],
    weight: 0.15, // 50ml glass bottle
    volume: 50, // 50ml from specifications
    dimensions: { length: 4, width: 4, height: 12 },
    skinType: "جافة", // For dry skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "لوشن للجسم بجوز المكاديميا وماء الورد",
    description: "لوسيون الجسم بنكهة جوز الماكاديميا وماء الورد من نات شيل يقدم تجربة ترطيب فاخرة يوميًا، حيث يمزج الجوهر المهدئ لماء الورد مع زيت الماكاديميا المغذي في زجاجة سعة 465 مل. مصمم بمهارة لتوفير ترطيب عميق يدوم طويلاً، هذا اللوشن الغني ولكنه سريع الامتصاص يذوب بسلاسة على البشرة ليعيد لها نعومتها ومرونتها الطبيعية وينعشها برائحة زهرية دقيقة تدوم طويلاً.مشبَع بخصائص تغذية الماكاديميا الغنية، يروي البشرة الجافة، ويستعيد توازن الرطوبة، ويعزز مرونة الجلد. انتعاش ماء الورد المهدئ يغلف حواسك بعطر زهري خفيف وأنيق وهادئ يجعلك تشعر بالانتعاش والاسترخاء طوال اليوم. تركيبته خفيفة وسريعة الامتصاص تنتشر بسهولة على البشرة وتمتص في ثوانٍ دون ترك أي بقايا ثقيلة أو لزجة أو دهنية. حجم 465 مل السخي مثالي للاستخدام اليومي للعناية بالبشرة للعائلة وللاستخدام الشخصي.",
    price: 325.0,
    stock: 100,
    ingredients: ["زيت المكاديميا", "ماء الورد", "جليسرين", "فيتامين E"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z1CBCF29800395B192678Z/45/_/1786880158/384886eb-2599-436e-ab45-a38b6f00f439.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z1CBCF29800395B192678Z/45/_/1786880158/c5f58a21-aa16-481c-a8e0-b4ad28753df8.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z1CBCF29800395B192678Z/45/_/1786880158/6fae2ee4-76bc-422c-9b1c-7f25a161672e.jpg?width=800",
    ],
    weight: 0.5, // 465ml lotion
    volume: 465, // 465ml from description
    dimensions: { length: 8, width: 6, height: 20 },
    skinType: "جافة", // For dry skin
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "لوشن الجسم المرطب المكثف من شان",
    description: "دلّلي بشرتك بترطيب فاخر مع لوشن شان بودي ميلك—غسول مرطب بعمق غني بالمكونات الفعّالة التي تجعل بشرتك ناعمة ومرنة ومشرقة لمدة تصل إلى 72 ساعة. بفضل تركيبته القوية التي تحتوي على حمض الهيالورونيك، نياكيناميد، سيراميدات، زبدة الشيا وزيت بذور العنب، يعالج لوشن شان بودي ميلك بفعالية الجفاف، الكيراتوسيس بيلاريس (جلد دجاجي) والالتهابات، ليترك بشرتك ناعمة كالحرير. قوامه خفيف يمتص بسرعة وغير لاصق، ومناسب لجميع أنواع البشرة، حتى الحساسة. الحجم الكبير 300 مل يقدم قيمة ممتازة للاستخدام اليومي الطويل.",
    price: 172.5,
    stock: 80,
    ingredients: ["حمض الهيالورونيك", "النياسيناميد", "السيراميدات", "زبدة الشيا", "زيت بذور العنب", "فيتامين E"],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZAC478156209FE8F00EF5Z/45/_/1780770156/676d6fe7-0a6f-42c6-8178-ddcc809d443c.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZAC478156209FE8F00EF5Z/45/_/1780770156/6eafdd4d-e1d7-4bd4-8181-b9f81458f1de.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZAC478156209FE8F00EF5Z/45/_/1780770156/f233dcaf-1bd0-4d09-a61b-f639317f27f2.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z8D36526F7EFC45853967Z/45/1748175666/b28c6e21-7c77-4992-a72b-bee1cd62230c.jpg?width=800",
    ],
    weight: 0.35, // 300ml lotion
    volume: 300, // 300ml from description
    dimensions: { length: 7, width: 7, height: 18 },
    skinType: "جافة", // For dry skin
  },
  //tools and accessories
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dd",
    name: "AFRICANANPC فرشاة ناعمة لفروة الرأس",
    description: "فرشاة تدليك ناعمة لفروة الرأس لنمو الشعر.",
    price: 119.0,
    stock: 100,
    images: [
      "https://f.nooncdn.com/p/pzsku/Z7BFDA0A38A0555FDE33CZ/45/_/1738055956/e37d9f7d-adf3-4c61-b79c-69da17102f01.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7BFDA0A38A0555FDE33CZ/45/_/1738672734/1aa868a6-aa8c-44d5-830a-20e6fc223477.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z7BFDA0A38A0555FDE33CZ/45/_/1738672350/6ce00076-b1d8-4f7b-ae38-7a20fc9df5f4.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dd",
    name: "Alice Wooden Comb مشط خشبي طبيعي",
    description: "مشط خشبي طبيعي، لطيف على الشعر وفروة الرأس.",
    price: 99.0,
    stock: 50,
    images: [
      "https://f.nooncdn.com/p/pzsku/Z383B556B57CAF380A940Z/45/_/1775091663/b1d09917-6fef-4218-8f4b-c79426d06483.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z383B556B57CAF380A940Z/45/_/1775091821/afbfd230-e5d3-4272-b738-1b509494e861.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z383B556B57CAF380A940Z/45/_/1775091821/ed594aec-4cad-4712-baee-3267d3838507.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dd",
    name: "Cytheria طقم فرش مكياج متعدد الاستخدامات من 14 قطعة",
    description: "طقم فرش احترافي من 14 قطعة بتشطيب وردي ذهبي/أسود.",
    price: 1150.0,
    stock: 30,
    images: [
      "https://f.nooncdn.com/p/pnsku/N20636779A/45/_/1766380509/f0d850c0-ab48-43ca-92cf-179096a6f808.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N20636779A/45/_/1764236071/38a3359f-9d16-4dba-a386-d4dcb8e99acc.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N20636779A/45/_/1764236072/1f26d699-ac07-4a9b-bf46-0434757942d2.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dd",
    name: "Generic Beauty Blender إسفنجة مكياج مع علبة مخروطية",
    description: "إسفنجة مزج المكياج مع علبة تخزين مخروطية واقية.",
    price: 29.95,
    stock: 200,
    images: [
      "https://f.nooncdn.com/p/pzsku/ZBBF551E23939933A9F25Z/45/_/1701614521/35bf7a16-481f-4f6d-ad75-a5b9804a5bf0.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZBBF551E23939933A9F25Z/45/_/1701614522/35e71308-6bb5-400d-8d0b-eb091442befa.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZBBF551E23939933A9F25Z/45/_/1701614523/a7e052fa-2489-433b-b560-9b8c04c21be8.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dd",
    name: "UVe Violet إسفنجة مكياج مضادة للميكروبات",
    description: "إسفنجة مكياج مضادة للميكروبات لتطبيق سلس.",
    price: 34.9,
    stock: 150,
    images: [
      "https://f.nooncdn.com/p/pzsku/ZBF192057E201B8935D2CZ/45/_/1733135680/b7ed00ad-5e77-412b-a835-a2107f50b300.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZBF192057E201B8935D2CZ/45/_/1733135726/90afbf5c-6464-469e-80ab-6d4ad46e8cc9.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZBF192057E201B8935D2CZ/45/_/1733135700/7077522b-b6f3-4cc1-aa6a-973ecc893d0c.jpg?width=800",
    ],
    skinType: "عادية",
  },
];

const owner_store_id = "6a8db64016293e067b46591d"; //consider as ObjectId not string despite these quotes
// Semon's Market (semon) => 6a8c7a7e1305b056a96d98a0
// Marcos_store           => 6a8db64016293e067b46591d

const SeedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    await Product.deleteMany({ owner_store_id });

    fs.writeFileSync(path.join(__dirname, "../sources/products.json"), JSON.stringify(seedData), "utf-8");
    seedData= fs.readFileSync(path.join(__dirname, "../sources/products.json"), "utf-8");
    seedData= JSON.parse(seedData.replace(/"\{id\}"/g, `"${owner_store_id}"`));
    const products= await Product.insertMany(seedData);
    await storeOwnerModel.findByIdAndUpdate(owner_store_id, {$inc:{total_products: products.length}}, {new: true});

     // Aggregate products by category to update category totalProducts
    const categoryCounts = {};
    for (const product of products) {
      const categoryId = product.category_id.toString();
      if (!categoryCounts[categoryId]) {
        categoryCounts[categoryId] = 0;
      }
      categoryCounts[categoryId]++;
    }

    // Update each category with its product count
    const categoryUpdatePromises = Object.entries(categoryCounts).map(
      ([categoryId, count]) => {
        return categoryModel.findByIdAndUpdate(
          categoryId,
          { $inc: { totalProducts: count } },  //without &inc if we want to reseed these initial products
          { new: true }
        );
      }
    );

    await Promise.all(categoryUpdatePromises); //runs multiple database update operations in parallel and waits for all of them to complete before continuing

    console.log(" All products seeded successfully!");
    process.exit();
  } catch (err) {
    console.error(" Seeding failed:", err.message);
    process.exit(1);
  }
};

SeedDB();