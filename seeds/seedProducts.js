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
    name: "Maybelline New York ماسكارا Volum' Express The Colossal القابلة للغسل - أسود",
    description: "ماسكارا مضادة للحجم لرموش جريئة ودراماتيكية.",
    price: 274.0,
    stock: 100,
    ingredients: ["ماء", "شمع العسل", "أكاسيد الحديد", "شمع الكرنوبا"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N13625792A/45/_/1767607682/ca23528c-ad73-4ce1-987b-aae1022c0df7.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13625792A/45/_/1764241942/2a78875b-ce92-462f-8d64-30d195b2e893.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N13625792A/45/_/1764242064/2b6b9999-9f8e-4a1c-8496-00a98d52fdc4.jpg?width=800",
    ],
    weight: 0.2,
    dimensions: { length: 10, width: 5, height: 5 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "Amanda Milano Nude Nation بودرة سائبة شبه شفافة فائقة النعومة وردي ناعم .6",
    description: "بودرة سائبة فائقة النعومة للحصول على لمسة نهائية ناعمة غير لامعة.",
    price: 259.0,
    stock: 50,
    ingredients: ["تلك", "ميكا", "سيليكا", "فيتامين E"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1773320164/2094a127-500a-4f3e-a260-e0aeb97e147e.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1775554255/170ec1de-459b-4908-94a0-9bf1e4a7cd27.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z57A87AF9BC6C8BC7D9A2Z/45/_/1775554228/5e0a2027-b4af-450b-b038-42ca4ab31c16.jpg?width=800",
    ],
    weight: 0.3,
    dimensions: { length: 8, width: 8, height: 5 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "SHEGLAM LOVE DIVE TENDER HEART بودرة خدود - خوخي",
    description: "بودرة خدود على شكل قلب مع صبغة خوخية ناعمة.",
    price: 405.05,
    stock: 75,
    ingredients: ["ميكا", "فلوروفلوجوبيتات اصطناعية", "ستيرات المغنيسيوم"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N70040979V/45/_/1706104929/96deac5d-cde0-41fe-814c-1e6c0626d02b.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70040979V/45/_/1706104932/cfb34253-0b27-4a06-932d-299dd85eda56.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70040979V/45/_/1706104933/56c30eb9-12fd-4450-9fa4-1d354a78e759.jpg?width=800",
    ],
    weight: 0.25,
    dimensions: { length: 7, width: 7, height: 2 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "Essence Extreme Shine Volume لمعة شفاه لامعة للغاية | توت براق",
    description: "لمعة شفاه عالية اللمعان غير لاصقة لتأثير النفخ.",
    price: 225.15,
    stock: 120,
    ingredients: ["بوليبيوتين", "بولي إيزوبوتين هيدروجين", "نكهة"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852042/f1352b6c-006e-4ffe-b64b-6ec238fdbd12.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852031/486d2e84-d939-403e-a8be-b29af0c2ce34.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N70131792V/45/_/1732852043/c4efd28b-936a-44a8-a460-3d813f6aafcd.jpg?width=800",
    ],
    weight: 0.1,
    dimensions: { length: 12, width: 2, height: 2 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69dc",
    name: "Maybelline Superstay Matte Ink أحمر شفاه سائل غير لامع وردي نونو 175 Ringle",
    description: "أحمر شفاه سائل غير لامع طويل الأمد مع ثبات عالي للون.",
    price: 635.0,
    stock: 80,
    ingredients: ["إيزودوديكان", "دايميثيكون", "تريميثيل سيلوكسيسيليكات"],
    images: [
      "https://f.nooncdn.com/p/v1615724291/N45208600A_1.jpg?width=800",
      "https://f.nooncdn.com/p/v1615724292/N45208600A_2.jpg?width=800",
      "https://f.nooncdn.com/p/v1615724290/N45208600A_3.jpg?width=800",
    ],
    weight: 0.15,
    dimensions: { length: 12, width: 2, height: 2 },
    skinType: "عادية",
  },
  //hair care products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "Aloe Eva ماسك شعر مقوي",
    description: "ماسك شعر مقوي غني بالصبار لشعر صحي.",
    price: 66.0,
    stock: 100,
    ingredients: ["مستخلص الصبار", "كحول سيتيل", "بانثينول"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z15C5E3BF9511B62C9158Z/45/_/1698776792/9e49fb96-f030-48e9-acc3-ce8d1b7d4ea2.jpg?width=800",
    ],
    weight: 0.3,
    dimensions: { length: 15, width: 10, height: 5 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "CLARY ماسك شعر 300 مل مع بروكابيل",
    description: "ماسك مضاد لتساقط الشعر مصمم للشعر الجاف والتالف.",
    price: 285.0,
    stock: 60,
    ingredients: ["بروكابيل", "كيراتين", "زبدة الشيا"],
    images: [
      "https://f.nooncdn.com/p/pzsku/ZE3AC361696972FB6D808Z/45/1765448777/d543988b-594b-4d26-bb36-0c33df2869e6.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283084/3d8245c2-5a2f-4827-aed6-6b3db5252d7f.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z26C3566C4E99EECEE179Z/45/_/1777283085/d0f2886b-11ee-49fc-9a6c-d367feb560cc.jpg?width=800",
    ],
    weight: 0.4,
    dimensions: { length: 10, width: 10, height: 8 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "L'Oréal Professionnel Absolut Repair ماسك جزيئي للشعر التالف جداً",
    description: "ماسك إصلاح احترافي لاستعادة البنية الجزيئية للشعر التالف جداً.",
    price: 1406.43,
    stock: 30,
    ingredients: ["ببتيدات بوندر", "أحماض أمينية"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z893DF81FEAD0ACF60D5DZ/45/_/1773139640/3b92652e-0210-44e6-8714-4614395552b4.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z893DF81FEAD0ACF60D5DZ/45/_/1773139640/abdb73b4-523b-45de-9f25-14082e6ad2c7.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z893DF81FEAD0ACF60D5DZ/45/_/1773139640/0d22be23-4f27-446f-8c52-49098f46d57d.jpg?width=800",
    ],
    weight: 0.3,
    dimensions: { length: 9, width: 9, height: 6 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "LEAVES ماسك لترطيب الشعر للاصلاح 200 مل",
    description: "ماسك ترطيب عميق لإصلاح الشعر بالأعشاب الهندية.",
    price: 198.0,
    stock: 50,
    ingredients: ["مستخلص الأعشاب الهندية", "جليسرين", "كحول سيتيريل"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z177BC1DE52862E6E84A1Z/45/_/1773493995/fa0e8ef7-6cd7-4dc8-88dd-3611fc033e8c.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z177BC1DE52862E6E84A1Z/45/_/1773493995/4158969e-9a0e-442a-bc22-f9a158e6423c.jpg?width=800",
    ],
    weight: 0.25,
    dimensions: { length: 16, width: 5, height: 4 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69df",
    name: "SKINOVA IMAGE سيروم شعر 100 مل",
    description: "سيروم شعر مع بروتين القمح المائي لإصلاح الأطراف المتقصفة وإضافة القوة.",
    price: 230.0,
    stock: 90,
    ingredients: ["بروتين القمح المائي", "سايكلوميثيكون", "دايميثيكونول"],
    images: [
      "https://f.nooncdn.com/p/pzsku/Z74EFF139F208877313DFZ/45/_/1775709338/3dc543c1-996c-4eaf-a40b-240c972f36b8.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z74EFF139F208877313DFZ/45/_/1775709338/ae8cb36b-70b1-4253-b97d-c9a77ee59f08.jpg?width=800",
    ],
    weight: 0.15,
    dimensions: { length: 5, width: 5, height: 12 },
    skinType: "عادية",
  },
  //men's grooming products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "Nivea Men لوشن ما بعد الحلاقة ديب كومفورت، مضاد للبكتيريا 100 مل",
    description: "لوشن ما بعد الحلاقة مع حماية مضادة للبكتيريا للحصول على لمسة نهائية مريحة ومنعشة.",
    price: 241.8,
    stock: 80,
    ingredients: ["أكوا", "كحول مغير الخواص", "جليسرين", "نشا فوسفات ثنائي"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N19516297A/45/_/1767607351/af6e84a0-a561-4467-98d9-a1a12b37c2ce.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N19516297A/45/_/1732554835/7e3c05f1-bfd9-465a-ab0a-a0ee77ed91aa.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N19516297A/45/_/1732554836/6cfa34c9-f8c0-40e4-9a9d-ef908a6f2df2.jpg?width=800",
    ],
    weight: 0.2,
    dimensions: { length: 8, width: 5, height: 12 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "Nivea MEN جل حلاقة للبشرة الحساسة، بابونج وهماميليس",
    description: "جل حلاقة مهدئ مصمم خصيصًا للبشرة الحساسة.",
    price: 207.4,
    stock: 100,
    ingredients: ["بابونج", "هماميليس", "جليسرين"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N11292849A/45/_/1775549942/3a5c07ed-1ac0-4a9d-8276-955f195d9130.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N11292849A/45/_/1737984907/431b67f8-3c7e-4e5c-80ce-cb4b5d986a4a.jpg?width=800",
    ],
    weight: 0.25,
    dimensions: { length: 5, width: 5, height: 18 },
    skinType: "حساسة",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "Nivea MEN DEEP أسود كربون إسبريسو، مزيل عرق رول أون 50 مل",
    description: "مزيل عرق رول أون مع كربون أسود لحماية طويلة الأمد.",
    price: 70.7,
    stock: 150,
    ingredients: ["كلوروهيدرات الألومنيوم", "مسحوق الفحم", "زيت الأفوكادو"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N39790177A/45/_/1767607812/c7e66898-f9e5-4ce4-8734-d4eb8f1a5230.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N15767861A/45/_/1766585081/4156b4cc-fc54-4094-b51a-fdf354472cd2.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N15767861A/45/_/1766585081/cad3fbd5-0063-4a2b-a996-ee421b8d40e6.jpg?width=800",
    ],
    weight: 0.1,
    dimensions: { length: 4, width: 4, height: 10 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "Nivea MEN Cool Kick جل استحمام 3 في 1 250 مل",
    description: "جل استحمام 3 في 1 منعش للجسم والوجه والشعر.",
    price: 83.6,
    stock: 120,
    ingredients: ["أكوا", "لاوريث سلفات الصوديوم", "كوكاميدوبروبيل بيتين", "منثول"],
    images: [
      "https://f.nooncdn.com/p/pnsku/N49145577A/45/_/1715693964/59a893d1-0271-4382-872e-56ebf8abee33.jpg?width=800",
      "https://f.nooncdn.com/p/v1626262027/N49145577A_2.jpg?width=800",
      "https://f.nooncdn.com/p/v1626262027/N49145577A_3.jpg?width=800",
    ],
    weight: 0.3,
    dimensions: { length: 7, width: 4, height: 18 },
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69e0",
    name: "Fogg Paradise عطر بخاخ 120 مل",
    description: "عطر بخاخ طويل الأمد ومنعش برائحة نابضة بالحياة.",
    price: 130.0,
    stock: 70,
    ingredients: ["كحول إيثيلي", "عطر", "بروبيلين جليكول"],
    images: [
      "https://f.nooncdn.com/p/v1568114684/N29713927A_1.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z3A64CB0A72B840735FABZ/45/_/1738064404/f047b61f-73f0-4e4c-8a7f-eb30a46b9fc1.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z93E0F7028EB0E48B8466Z/45/1744178475/a77161ce-b412-459e-8af3-08a29ce8842d.jpg?width=800",
    ],
    weight: 0.15,
    dimensions: { length: 5, width: 5, height: 15 },
    skinType: "عادية",
  },
  //body care products
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "Glysolid لوشن للجسم كلاسيك",
    description: "عناية مكثفة للبشرة الجافة والعادية.",
    price: 183.0,
    stock: 50,
    images: [
      "https://f.nooncdn.com/p/pzsku/Z026C0ADD5EE618467CD8Z/45/_/1776947100/9f493ea4-0898-4d2b-86d4-e33f8b545524.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "Vaseline Intensive Care Cocoa Radiant",
    description: "مصنوع من 100٪ زبدة كاكاو نقية للحصول على توهج طبيعي.",
    price: 275.0,
    stock: 3,
    images: [
      "https://f.nooncdn.com/p/pnsku/N23903751A/45/_/1767607791/49643f93-bfda-4632-95db-96ca0d201b7d.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N23903751A/45/_/1764236008/65da4bdc-f8cd-4eda-b9d6-d12526dc6f63.jpg?width=800",
      "https://f.nooncdn.com/p/pnsku/N23903751A/45/_/1764236005/9c87f170-f8db-4589-bd86-1bcf45af4d50.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "Nuxe Huile Prodigieuse زيت جاف متعدد الأغراض",
    description: "زيت جاف متعدد الأغراض للوجه والجسم والشعر.",
    price: 3450.0,
    stock: 2,
    images: [
      "https://f.nooncdn.com/p/v1601103580/N11305302A_1.jpg?width=800",
      "https://f.nooncdn.com/p/v1601103581/N11305302A_2.jpg?width=800",
      "https://f.nooncdn.com/p/v1601103582/N11305302A_3.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "Nut Shell زيت جل للجسم بجوز الهند والكاكاو",
    description: "زيت جل للجسم مصنوع يدويًا لامتصاص عميق.",
    price: 325.0,
    stock: 100,
    images: [
      "https://f.nooncdn.com/p/pzsku/Z70B9E37366252A5004E7Z/45/1760265205/c5b25312-d28e-4c4c-833c-1d4e7ffaebe5.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z70B9E37366252A5004E7Z/45/1760265205/a8458bd8-6d44-4f6c-8323-7857ea4f5218.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/ZF7A524F117A7F873B038Z/45/_/1771779472/55404c2f-c625-4a5b-89fc-0b024cdfa1a5.jpg?width=800",
    ],
    skinType: "عادية",
  },
  {
    owner_store_id: "{id}",
    category_id: "69e387b312d268b6bb3b69de",
    name: "Shaan Body Milk",
    description: "ترطيب لمدة 72 ساعة مع بنتافيتين، حمض الهيالورونيك، نياسيناميد وسيراميد. للبشرة الجافة إلى شديدة الجفاف.",
    price: 172.5,
    stock: 80,
    images: [
      "https://f.nooncdn.com/p/pzsku/Z8D36526F7EFC45853967Z/45/1764270443/c2616570-8d98-4df4-a89e-8473b8b79a94.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z8D36526F7EFC45853967Z/45/1748175666/5312f163-a8cc-4d05-b14d-2f4da4c7e68b.jpg?width=800",
      "https://f.nooncdn.com/p/pzsku/Z8D36526F7EFC45853967Z/45/1748175666/b28c6e21-7c77-4992-a72b-bee1cd62230c.jpg?width=800",
    ],
    skinType: "جافة",
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