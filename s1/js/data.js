/* ============================================================
   data.js - 静态数据
   包含:分类元信息 / 盐湖 / 城市 / 景点 / 每日路线(9 天)
   修改说明:坐标小数点后 4 位(精度约 ±11 米)
   ============================================================ */

const categories = {
    salt_lake: { name: '盐湖', color: '#e74c3c', emoji: '🧂' },
    city:      { name: '主要城市', color: '#3498db', emoji: '🏙️' },
    scenic:    { name: '常规景点', color: '#27ae60', emoji: '🏞️' },
    route:     { name: '环线路线', color: '#f39c12', emoji: '🛣️' }
};

const saltLakes = [
    { name:'察尔汗盐湖', lat:36.4111, lng:95.2086, cat:'salt_lake',
      desc:'亚洲最大、世界第二盐湖,湖水呈通透的苹果绿,有"万丈盐桥"和盐花奇观。',
      ticket:'¥40 + 大巴¥60', best:'6-9月', tip:'晴天上午光线最佳,本攻略 9 天路过不专程停留',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chaerhan%20Salt%20Lake%20Qinghai%20vast%20green%20emerald%20water%20salt%20bridge%20aerial%20view&image_size=landscape_4_3' },
    { name:'大柴旦翡翠湖', lat:37.8689, lng:95.2802, cat:'salt_lake',
      desc:'数十个大小盐池组成,因矿物质不同呈现蓝、绿、黄等多种色彩,犹如散落人间的"调色板"。',
      ticket:'¥50-60', best:'6-9月', tip:'Day4 清晨游览,避开人流与烈日',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Da%20Chaidan%20Emerald%20Lake%20Qinghai%20colorful%20turquoise%20pools%20mineral%20colors%20aerial&image_size=landscape_4_3' },
    { name:'茶卡盐湖', lat:36.7186, lng:99.0869, cat:'salt_lake',
      desc:'老牌网红"天空之镜",湖面平坦如镜,晴天完美倒映天空,拍出"水上漂"效果。',
      ticket:'¥60 + 小火车¥50', best:'6-8月', tip:'Day5 可早起看日出,穿鲜艳颜色衣服',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chaka%20Salt%20Lake%20Sky%20Mirror%20Qinghai%20reflection%20white%20salt%20flat%20lake&image_size=landscape_4_3' },
    { name:'茫崖翡翠湖', lat:38.1892, lng:90.7983, cat:'salt_lake',
      desc:'环线西端的隐世秘境,色彩宛如上好的翡翠,本攻略不进入。',
      ticket:'免费', best:'6-9月', tip:'9 天版未延伸至此,经典 7/8 天版可加',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mangya%20Emerald%20Lake%20Qinghai%20green%20emerald%20water%20hidden%20secret%20desert&image_size=landscape_4_3' },
    { name:'东台吉乃尔湖', lat:37.4278, lng:93.9089, cat:'salt_lake',
      desc:'被誉为"中国版马尔代夫",Tiffany 蓝湖水,水天一色。',
      ticket:'免费', best:'6-9月', tip:'Day4 顺路经过,可短停拍照',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=East%20Taijnar%20Lake%20Maldives%20of%20China%20Tiffany%20blue%20water%20white%20beach&image_size=landscape_4_3' },
    { name:'西台吉乃尔湖', lat:37.4653, lng:93.4306, cat:'salt_lake',
      desc:'G315 国道旁的"双色湖",公路从中穿过,两侧湖水颜色迥异。',
      ticket:'免费', best:'6-9月', tip:'与 G315 U 型公路串游,注意横穿公路拍照安全',
      img:'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=West%20Taijnar%20Lake%20two%20color%20blue%20green%20G315%20highway%20Qinghai%20aerial&image_size=landscape_4_3' }
];

const cities = [
    { name:'成都', lat:30.5728, lng:104.0668, cat:'city',
      desc:'9 天环线起点/终点,四川省会,海拔约 500 米。',
      ticket:'—', best:'全年', tip:'出发前检查车况,准备防高反药物' },
    { name:'陇南', lat:33.4000, lng:104.9217, cat:'city',
      desc:'返程分段城市,陕甘川交界,海拔约 1000 米。',
      ticket:'—', best:'全年', tip:'可顺道游览官鹅沟、哈达铺' },
    { name:'西宁', lat:36.6232, lng:101.7804, cat:'city',
      desc:'青海省会,9 天环线中段落脚点,海拔 2261 米。',
      ticket:'—', best:'全年', tip:'可品尝青稞、酿皮、牦牛肉' },
    { name:'兰州', lat:36.0611, lng:103.8343, cat:'city',
      desc:'甘肃省会,Day1 仅过夜休整,不做游玩。',
      ticket:'—', best:'全年', tip:'过夜即可,不进市区减少回头路' },
    { name:'敦煌', lat:40.1421, lng:94.6612, cat:'city',
      desc:'丝路重镇。本次 9 天方案跳过不停。',
      ticket:'—', best:'5-10月', tip:'本攻略未停敦煌,经典 7 天版可加' },
    { name:'嘉峪关', lat:39.7716, lng:98.2899, cat:'city',
      desc:'明代万里长城西端起点。本次跳过不停。',
      ticket:'—', best:'5-10月', tip:'本攻略已删 Day5 停靠,减少长途' },
    { name:'张掖', lat:38.9259, lng:100.4499, cat:'city',
      desc:'七彩丹霞所在地,河西走廊重镇。',
      ticket:'—', best:'6-9月', tip:'傍晚看丹霞色彩最艳' },
    { name:'德令哈', lat:37.3695, lng:97.3764, cat:'city',
      desc:'海西州首府,环线中段补给站。',
      ticket:'—', best:'全年', tip:'海子诗歌陈列馆值得一访' },
    { name:'格尔木', lat:36.4065, lng:94.9286, cat:'city',
      desc:'进藏门户,察尔汗盐湖所在地。',
      ticket:'—', best:'6-9月', tip:'海拔 2780 米,注意高反' },
    { name:'大柴旦', lat:37.8525, lng:95.3625, cat:'city',
      desc:'翡翠湖所在地,环线中转小镇。',
      ticket:'—', best:'6-9月', tip:'镇上住宿紧张,提前预订' },
    { name:'茫崖', lat:38.2474, lng:90.8578, cat:'city',
      desc:'新疆青海交界,茫崖翡翠湖所在地。',
      ticket:'—', best:'6-9月', tip:'本攻略 9 天不延伸至茫崖' }
];

const scenics = [
    { name:'莫高窟', lat:40.0356, lng:94.8106, cat:'scenic',
      desc:'世界文化遗产,千佛洞,佛教艺术宝库。',
      ticket:'¥238(需预约)', best:'5-10月', tip:'本攻略 9 天跳过不停;经典 7 天版可加' },
    { name:'鸣沙山月牙泉', lat:40.0938, lng:94.6635, cat:'scenic',
      desc:'沙漠中的奇景,月牙形泉水千年不涸。',
      ticket:'¥110', best:'5-10月', tip:'本攻略 9 天跳过不停' },
    { name:'嘉峪关关城', lat:39.7720, lng:98.2756, cat:'scenic',
      desc:'明代长城西端起点,"天下第一雄关"。',
      ticket:'¥110', best:'5-10月', tip:'本攻略跳过,仅路过嘉峪关市' },
    { name:'张掖七彩丹霞', lat:38.9133, lng:100.1231, cat:'scenic',
      desc:'中国最美丹霞地貌之一,色彩斑斓如调色板。北入口位于临泽县。',
      ticket:'¥74 + 车¥20', best:'6-9月', tip:'Day2 下午 15:30 入园,观赏日落光影' },
    { name:'G315 U型公路', lat:38.0694, lng:93.8589, cat:'scenic',
      desc:'中国 66 号公路,笔直天路陡然起伏,出片圣地(U 形起伏段)。',
      ticket:'免费', best:'全年', tip:'严禁路中央停车拍照!路边安全区打卡' },
    { name:'大柴旦翡翠湖', lat:37.8689, lng:95.2802, cat:'scenic',
      desc:'数十个大小盐池组成,因矿物质不同呈现蓝、绿、黄等多种色彩。',
      ticket:'¥50-60', best:'6-9月', tip:'Day4 清晨前往,避开人流与烈日' },
    { name:'水上雅丹', lat:38.0739, lng:93.8900, cat:'scenic',
      desc:'世界上唯一一片在水中的雅丹地貌,乌素特水上雅丹(鸭湖)。',
      ticket:'¥60 + 车¥30', best:'5-10月', tip:'建议 16 点后入园,光线柔和出片' },
    { name:'茶卡盐湖', lat:36.7186, lng:99.0869, cat:'scenic',
      desc:'老牌网红"天空之镜",湖面平坦如镜,拍出"水上漂"效果。',
      ticket:'¥60 + 小火车¥50', best:'6-8月', tip:'Day5 可选早起观赏日出' },
    { name:'青海湖·石乃亥', lat:36.9926, lng:99.8122, cat:'scenic',
      desc:'环湖西路秘境,避开黑马河人流,正对湖面日落方向。',
      ticket:'免费', best:'6-9月', tip:'优先订临湖民宿,湖景房需提前 1 个月' },
    { name:'青海湖日出点', lat:36.9608, lng:99.7858, cat:'scenic',
      desc:'石乃亥北岸,高原日出静谧观赏点。',
      ticket:'免费', best:'6-9月', tip:'清晨湖边静候,温度低备薄羽绒' },
    { name:'雅丹魔鬼城', lat:40.4956, lng:93.0586, cat:'scenic',
      desc:'敦煌西北方向的雅丹地貌群,西海舰队奇观。',
      ticket:'¥120 含观光车', best:'5-10月', tip:'本攻略 9 天未延伸至此' },
    { name:'可鲁克湖', lat:37.2833, lng:96.8833, cat:'scenic',
      desc:'德令哈附近,水草丰美的湿地湖泊,与托素湖一咸一淡相连。',
      ticket:'免费', best:'6-9月', tip:'芦苇荡中观鸟胜地' }
];

// 每日分段:仅 9 天深度版(坐标与 allItems 完全一致)
const dayRoutes = {
    9: [
        { name:'D1 成都→兰州(过夜)', km:960, points:[
            { name:'成都', lat:30.5728, lng:104.0668 },
            { name:'兰州', lat:36.0611, lng:103.8343 }
        ]},
        { name:'D2 兰州→张掖七彩丹霞', km:500, points:[
            { name:'兰州', lat:36.0611, lng:103.8343 },
            { name:'张掖七彩丹霞', lat:38.9133, lng:100.1231 }
        ]},
        { name:'D3 张掖→大柴旦', km:530, points:[
            { name:'张掖', lat:38.9259, lng:100.4499 },
            { name:'大柴旦', lat:37.8525, lng:95.3625 }
        ]},
        { name:'D4 翡翠湖→U型公路→水上雅丹→茶卡', km:420, points:[
            { name:'大柴旦翡翠湖', lat:37.8689, lng:95.2802 },
            { name:'G315 U型公路', lat:38.0694, lng:93.8589 },
            { name:'水上雅丹', lat:38.0739, lng:93.8900 },
            { name:'茶卡盐湖', lat:36.7186, lng:99.0869 }
        ]},
        { name:'D5 茶卡→青海湖·石乃亥', km:210, points:[
            { name:'茶卡盐湖', lat:36.7186, lng:99.0869 },
            { name:'青海湖·石乃亥', lat:36.9926, lng:99.8122 }
        ]},
        { name:'D6 青海湖全天慢玩', km:120, points:[
            { name:'青海湖·石乃亥', lat:36.9926, lng:99.8122 },
            { name:'青海湖日出点', lat:36.9608, lng:99.7858 },
            { name:'青海湖·石乃亥', lat:36.9926, lng:99.8122 }
        ]},
        { name:'D7 石乃亥→西宁', km:340, points:[
            { name:'青海湖·石乃亥', lat:36.9926, lng:99.8122 },
            { name:'西宁', lat:36.6232, lng:101.7804 }
        ]},
        { name:'D8 西宁→陇南(拆分长途)', km:520, points:[
            { name:'西宁', lat:36.6232, lng:101.7804 },
            { name:'陇南', lat:33.4000, lng:104.9217 }
        ]},
        { name:'D9 陇南→成都(平安到家)', km:450, points:[
            { name:'陇南', lat:33.4000, lng:104.9217 },
            { name:'成都', lat:30.5728, lng:104.0668 }
        ]}
    ]
};

// 9 天行程摘要(侧边面板底部展示)
const tripSummary = {
    startDate: '2026-09-30',
    route: '成都 → 兰州 → 张掖 → 大柴旦 → 茶卡 → 青海湖 → 西宁 → 陇南 → 成都',
    duration: '9 天 8 晚,跳过嘉峪关、不停敦煌',
    features: '青海湖连续 2 晚深度慢游',
    tips: [
        '离开城镇加满油,环湖西路加油站稀少',
        '水上雅丹 15 点后入园光线最佳',
        '高原昼夜温差大,备薄羽绒 + 全套防晒',
        '石乃亥优先临湖民宿,避开黑马河人流'
    ]
};

// 暴露到 window,供其他脚本使用
window.AppData = {
    categories, saltLakes, cities, scenics, dayRoutes, tripSummary
};