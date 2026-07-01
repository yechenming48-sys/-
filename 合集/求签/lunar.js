/**
 * 紫微斗数核心算法与农历转换库
 * 包含公农历转换 (1900-2100) 以及紫微斗数排盘数学模型
 */

// 1. 农历数据及转换核心 (基于吉阳历史版本 calendar.js)
const calendar = {
  lunarInfo: [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
    0x0d520 // 2100
  ],
  solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  Gan: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
  Zhi: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
  Animals: ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"],
  solarTerm: [
    "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
    "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
  ],
  sTermInfo: [
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f',
    '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f',
    'b027097bd097c36b0b6fc9274c91aa', '9778397bd19801ec9210c965cc920e', '97b6b97bd19801ec95f8c965cc920f',
    '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd197c36c9210c9274c91aa',
    '97b6b97bd19801ec95f8c965cc920e', '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36c9210c9274c920e', '97b6b97bd19801ec95f8c965cc920f', '97bcf97c3598082c95f8c965cc920f',
    '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f',
    '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c359801ec95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd097bd07f595b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9210c8dc2', '9778397bd19801ec9210c9274c920e', '97b6b97bd19801ec95f8c965cc920f',
    '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
    '97b6b97bd19801ec95f8c965cc920f', '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bd07f1487f595b0b0bc920fb0722',
    '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f531b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf7f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bb0b6fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '9778397bd097c36b0b6fc9210c91aa', '97b6b97bd197c36c9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
    '97b6b7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36b0b70c9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b7f0e47f531b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '9778397bd097c36b0b6fc9210c91aa', '97b6b7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '977837f0e37f149b0723b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c35b0b6fc9210c8dc2',
    '977837f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc9210c8dc2', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '977837f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd',
    '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '977837f0e37f14998082b0723b06bd', '7f07e7f0e37f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f595b0b0bb0b6fb0722', '7f0e37f0e37f14898082b0723b02d5',
    '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f531b0b0bb0b6fb0722',
    '7f0e37f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e37f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35',
    '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f149b0723b0787b0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0723b06bd',
    '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722', '7f0e37f0e366aa89801eb072297c35',
    '7ec967f0e37f14998082b0723b06bd', '7f07e7f0e37f14998083b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14898082b0723b02d5', '7f07e7f0e37f14998082b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66aa89801e9808297c35', '665f67f0e37f14898082b0723b02d5',
    '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66a449801e9808297c35',
    '665f67f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0787b0721',
    '7f0e36665b66a449801e9808297c35', '665f67f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e26665b66a449801e9808297c35', '665f67f0e37f1489801eb072297c35',
    '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722'
  ],
  nStr1: ["日", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"],
  nStr2: ["初", "十", "廿", "卅"],
  nStr3: ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "腊月"],

  lYearDays: function (y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (calendar.lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + calendar.leapDays(y);
  },

  leapMonth: function (y) {
    return calendar.lunarInfo[y - 1900] & 0xf;
  },

  leapDays: function (y) {
    if (calendar.leapMonth(y)) {
      return (calendar.lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  },

  monthDays: function (y, m) {
    if (m > 12 || m < 1) return -1;
    return (calendar.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  },

  solarDays: function (y, m) {
    if (m > 12 || m < 1) return -1;
    let ms = m - 1;
    if (ms == 1) {
      return ((y % 4 == 0) && (y % 100 != 0) || (y % 400 == 0)) ? 29 : 28;
    } else {
      return calendar.solarMonth[ms];
    }
  },

  toGanZhiYear: function (lYear) {
    let ganKey = (lYear - 3) % 10;
    let zhiKey = (lYear - 3) % 12;
    if (ganKey == 0) ganKey = 10;
    if (zhiKey == 0) zhiKey = 12;
    return calendar.Gan[ganKey - 1] + calendar.Zhi[zhiKey - 1];
  },

  toAstro: function (cMonth, cDay) {
    let s = "魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯";
    let arr = [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22];
    return s.substr(cMonth * 2 - (cDay < arr[cMonth - 1] ? 2 : 0), 2) + "座";
  },

  toGanZhi: function (offset) {
    return calendar.Gan[offset % 10] + calendar.Zhi[offset % 12];
  },

  getTerm: function (y, n) {
    if (y < 1900 || y > 2100) return -1;
    if (n < 1 || n > 24) return -1;
    let _table = calendar.sTermInfo[y - 1900];
    let _info = [
      parseInt('0x' + _table.substr(0, 5)).toString(),
      parseInt('0x' + _table.substr(5, 5)).toString(),
      parseInt('0x' + _table.substr(10, 5)).toString(),
      parseInt('0x' + _table.substr(15, 5)).toString(),
      parseInt('0x' + _table.substr(20, 5)).toString(),
      parseInt('0x' + _table.substr(25, 5)).toString()
    ];
    let _calday = [
      _info[0].substr(0, 1), _info[0].substr(1, 2), _info[0].substr(3, 1), _info[0].substr(4, 2),
      _info[1].substr(0, 1), _info[1].substr(1, 2), _info[1].substr(3, 1), _info[1].substr(4, 2),
      _info[2].substr(0, 1), _info[2].substr(1, 2), _info[2].substr(3, 1), _info[2].substr(4, 2),
      _info[3].substr(0, 1), _info[3].substr(1, 2), _info[3].substr(3, 1), _info[3].substr(4, 2),
      _info[4].substr(0, 1), _info[4].substr(1, 2), _info[4].substr(3, 1), _info[4].substr(4, 2),
      _info[5].substr(0, 1), _info[5].substr(1, 2), _info[5].substr(3, 1), _info[5].substr(4, 2)
    ];
    return parseInt(_calday[n - 1]);
  },

  toChinaMonth: function (m) {
    if (m > 12 || m < 1) return -1;
    return calendar.nStr3[m - 1];
  },

  toChinaDay: function (d) {
    switch (d) {
      case 10: return '初十';
      case 20: return '二十';
      case 30: return '三十';
      default:
        let s = calendar.nStr2[Math.floor(d / 10)];
        s += calendar.nStr1[d % 10];
        return s;
    }
  },

  getAnimal: function (y) {
    return calendar.Animals[(y - 4) % 12];
  },

  solar2lunar: function (y, m, d) {
    if (y < 1900 || y > 2100) return -1;
    if (y == 1900 && m == 1 && d < 31) return -1;
    let objDate = new Date(y, parseInt(m) - 1, d);
    let i, leap = 0, temp = 0;
    y = objDate.getFullYear();
    m = objDate.getMonth() + 1;
    d = objDate.getDate();
    let offset = (Date.UTC(objDate.getFullYear(), objDate.getMonth(), objDate.getDate()) - Date.UTC(1900, 0, 31)) / 86400000;
    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = calendar.lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      i--;
    }
    let isTodayObj = new Date(), isToday = false;
    if (isTodayObj.getFullYear() == y && isTodayObj.getMonth() + 1 == m && isTodayObj.getDate() == d) {
      isToday = true;
    }
    let nWeek = objDate.getDay(), cWeek = calendar.nStr1[nWeek];
    if (nWeek == 0) nWeek = 7;
    let year = i;
    leap = calendar.leapMonth(i);
    let isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i == (leap + 1) && isLeap == false) {
        --i;
        isLeap = true;
        temp = calendar.leapDays(year);
      } else {
        temp = calendar.monthDays(year, i);
      }
      if (isLeap == true && i == (leap + 1)) {
        isLeap = false;
      }
      offset -= temp;
    }
    if (offset == 0 && leap > 0 && i == leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --i;
      }
    }
    if (offset < 0) {
      offset += temp;
      --i;
    }
    let month = i;
    let day = offset + 1;
    let sm = m - 1;
    let gzY = calendar.toGanZhiYear(year);
    let firstNode = calendar.getTerm(y, (m * 2 - 1));
    let secondNode = calendar.getTerm(y, (m * 2));
    let gzM = calendar.toGanZhi((y - 1900) * 12 + m + 11);
    if (d >= firstNode) {
      gzM = calendar.toGanZhi((y - 1900) * 12 + m + 12);
    }
    let isTerm = false;
    let Term = null;
    if (firstNode == d) {
      isTerm = true;
      Term = calendar.solarTerm[m * 2 - 2];
    }
    if (secondNode == d) {
      isTerm = true;
      Term = calendar.solarTerm[m * 2 - 1];
    }
    let dayCyclical = Date.UTC(y, sm, 1, 0, 0, 0, 0) / 86400000 + 25567 + 10;
    let gzD = calendar.toGanZhi(dayCyclical + d - 1);
    let astro = calendar.toAstro(m, d);
    return {
      'lYear': year, 'lMonth': month, 'lDay': day, 'Animal': calendar.getAnimal(year),
      'IMonthCn': (isLeap ? "闰" : '') + calendar.toChinaMonth(month), 'IDayCn': calendar.toChinaDay(day),
      'cYear': y, 'cMonth': m, 'cDay': d, 'gzYear': gzY, 'gzMonth': gzM, 'gzDay': gzD,
      'isToday': isToday, 'isLeap': isLeap, 'nWeek': nWeek, 'ncWeek': "星期" + cWeek,
      'isTerm': isTerm, 'Term': Term, 'astro': astro
    };
  },

  lunar2solar: function (y, m, d, isLeapMonth) {
    isLeapMonth = !!isLeapMonth;
    let leapMonth = calendar.leapMonth(y);
    if (isLeapMonth && (leapMonth != m)) { return -1; }
    if (y == 2100 && m == 12 && d > 1 || y == 1900 && m == 1 && d < 31) { return -1; }
    let day = calendar.monthDays(y, m);
    let _day = day;
    if (isLeapMonth) {
      _day = calendar.leapDays(y, m);
    }
    if (y < 1900 || y > 2100 || d > _day) { return -1; }
    let offset = 0;
    for (let i = 1900; i < y; i++) {
      offset += calendar.lYearDays(i);
    }
    let leap = 0, isAdd = false;
    for (let i = 1; i < m; i++) {
      leap = calendar.leapMonth(y);
      if (!isAdd) {
        if (leap <= i && leap > 0) {
          offset += calendar.leapDays(y);
          isAdd = true;
        }
      }
      offset += calendar.monthDays(y, i);
    }
    if (isLeapMonth) { offset += day; }
    let stmap = Date.UTC(1900, 1, 30, 0, 0, 0);
    let calObj = new Date((offset + d - 31) * 86400000 + stmap);
    let cY = calObj.getUTCFullYear();
    let cM = calObj.getUTCMonth() + 1;
    let cD = calObj.getUTCDate();
    return calendar.solar2lunar(cY, cM, cD);
  }
};


// 2. 紫微斗数排盘数学模型
const ziwei = {
  // 地支标准序号：0:子, 1:丑, 2:寅, 3:卯, 4:辰, 5:巳, 6:午, 7:未, 8:申, 9:酉, 10:戌, 11:亥
  // 天干标准序号：0:甲, 1:乙, 2:丙, 3:丁, 4:戊, 5:己, 6:庚, 7:辛, 8:壬, 9:癸
  
  // 转换标准地支为排盘 4x4 网格索引 (寅为左下角 0, 顺时针)
  branchToGrid: [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  gridToBranch: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1],

  // 计算五行局
  getFiveElementPhase: function (stemIdx, branchIdx) {
    const S = stemIdx + 1; // 1-based Stem (1-10)
    const B = branchIdx + 1; // 1-based Branch (1-12)
    
    const S_prime = Math.ceil(S / 2); // 甲乙=1, 丙丁=2, 戊己=3, 庚辛=4, 壬癸=5
    
    let B_prime = 0;
    if ([1, 2, 7, 8].includes(B)) B_prime = 1;      // 子丑午未
    else if ([3, 4, 9, 10].includes(B)) B_prime = 2; // 寅卯申酉
    else if ([5, 6, 11, 12].includes(B)) B_prime = 3; // 辰巳戌亥
    
    let N = S_prime + B_prime;
    if (N > 5) N -= 5;
    
    const phases = {
      1: { name: '木三局', value: 3, color: '#4caf50' },
      2: { name: '金四局', value: 4, color: '#ffeb3b' },
      3: { name: '水二局', value: 2, color: '#2196f3' },
      4: { name: '火六局', value: 6, color: '#f44336' },
      5: { name: '土五局', value: 5, color: '#ff9800' }
    };
    return phases[N];
  },

  // 计算紫微星标准地支位置
  getZiweiBranch: function (D, V) {
    let X = Math.ceil(D / V);
    let Y = X * V - D;
    let offset;
    if (Y % 2 === 0) {
      offset = X + Y - 1;
    } else {
      offset = X - Y - 1;
    }
    // 起点是寅 (2)
    return (2 + offset % 12 + 12) % 12;
  },

  // 核心排盘入口
  // input: { name, gender, birthYear, birthMonth, birthDay, birthHourIndex, calendarType }
  // calendarType: "solar" or "lunar"
  // gender: "男" or "女"
  calculateChart: function (input) {
    let lunar;
    if (input.calendarType === "solar") {
      lunar = calendar.solar2lunar(input.birthYear, input.birthMonth, input.birthDay);
    } else {
      // 农历输入
      lunar = calendar.lunar2solar(input.birthYear, input.birthMonth, input.birthDay, input.isLeapMonth || false);
    }

    if (lunar === -1 || !lunar) {
      throw new Error("日期转换失败，请确认年份在 1900-2100 之间。");
    }

    // 农历生辰数据
    const lYear = lunar.lYear;
    const lMonth = lunar.lMonth;
    const lDay = lunar.lDay;
    // 时辰地支序号 (0-11)
    const hBranch = input.birthHourIndex; 

    // 八字天干地支
    const gzYear = lunar.gzYear; // 甲子
    const gzMonth = lunar.gzMonth;
    const gzDay = lunar.gzDay;
    const gzHour = calendar.Gan[(calendar.Gan.indexOf(gzYear[0]) * 2 + hBranch) % 10] + calendar.Zhi[hBranch];

    // 年干
    const yStemCn = gzYear[0];
    const yStemIdx = calendar.Gan.indexOf(yStemCn);
    
    // 生肖
    const animal = lunar.Animal;

    // 1. 定命宫与身宫标准地支
    // Life = (Month - Hour + 1 + 12) % 12
    // Body = (Month + Hour + 1) % 12
    const lifeBranchIdx = (lMonth - hBranch + 1 + 12) % 12;
    const bodyBranchIdx = (lMonth + hBranch + 1) % 12;

    // 2. 定12宫在各支的分布 (逆时针排列)
    const palaceNames = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "交友", "官禄", "田宅", "福德", "父母"];
    // 建立 12 个地支宫位的信息结构
    let palaces = Array.from({ length: 12 }, (_, b) => {
      return {
        branchIdx: b,
        branchCn: calendar.Zhi[b],
        stemCn: "",
        stemIdx: -1,
        palaceName: "",
        stars: [],
        decades: ""
      };
    });

    // 分配宫位名称
    palaceNames.forEach((name, p) => {
      // 地支位置
      const bIdx = (lifeBranchIdx - p + 12) % 12;
      palaces[bIdx].palaceName = name;
      if (bIdx === bodyBranchIdx) {
        palaces[bIdx].palaceName += " (身宫)";
      }
    });

    // 3. 计算各宫干 (五虎遁)
    // 寅(2)的干 = (yStemIdx * 2 + 2) % 10
    const yinStemIdx = (yStemIdx * 2 + 2) % 10;
    for (let i = 0; i < 12; i++) {
      // 距离寅(2)的步数
      const steps = (i - 2 + 12) % 12;
      const sIdx = (yinStemIdx + steps) % 10;
      palaces[i].stemIdx = sIdx;
      palaces[i].stemCn = calendar.Gan[sIdx];
    }

    // 4. 计算命宫的五行局
    const lifePalaceStemIdx = palaces[lifeBranchIdx].stemIdx;
    const phaseObj = this.getFiveElementPhase(lifePalaceStemIdx, lifeBranchIdx);
    const phaseName = phaseObj.name;
    const phaseValue = phaseObj.value;

    // 5. 定大限区间安排
    // 阳男阴女顺行，阴男阳女逆行
    // 阳干：甲丙戊庚壬 (偶数)，阴干：乙丁己辛癸 (奇数)
    const isYangStem = (yStemIdx % 2 === 0);
    const isMale = (input.gender === "男");
    const isClockwise = (isYangStem === isMale);

    // 顺行/逆行排大限
    palaceNames.forEach((_, p) => {
      const direction = isClockwise ? 1 : -1;
      const bIdx = (lifeBranchIdx + p * direction + 12) % 12;
      const startAge = phaseValue + p * 10;
      const endAge = startAge + 9;
      palaces[bIdx].decades = `${startAge}-${endAge}`;
    });

    // 6. 安星曜
    // A. 安紫微星
    const ziweiIdx = this.getZiweiBranch(lDay, phaseValue);
    
    // 安紫微星系主星
    const ziweiStars = [
      { name: "紫微", type: "major", branch: ziweiIdx },
      { name: "天机", type: "major", branch: (ziweiIdx - 1 + 12) % 12 },
      { name: "太阳", type: "major", branch: (ziweiIdx - 3 + 12) % 12 },
      { name: "武曲", type: "major", branch: (ziweiIdx - 4 + 12) % 12 },
      { name: "天同", type: "major", branch: (ziweiIdx - 5 + 12) % 12 },
      { name: "廉贞", type: "major", branch: (ziweiIdx - 8 + 12) % 12 }
    ];

    // B. 安天府星 (与紫微在寅申轴对称: Z + T = 4 % 12)
    const tianfuIdx = (4 - ziweiIdx + 12) % 12;
    
    // 安天府星系主星
    const tianfuStars = [
      { name: "天府", type: "major", branch: tianfuIdx },
      { name: "太阴", type: "major", branch: (tianfuIdx + 1) % 12 },
      { name: "贪狼", type: "major", branch: (tianfuIdx + 2) % 12 },
      { name: "巨门", type: "major", branch: (tianfuIdx + 3) % 12 },
      { name: "天相", type: "major", branch: (tianfuIdx + 4) % 12 },
      { name: "天梁", type: "major", branch: (tianfuIdx + 5) % 12 },
      { name: "七杀", type: "major", branch: (tianfuIdx + 6) % 12 },
      { name: "破军", type: "major", branch: (tianfuIdx + 10) % 12 }
    ];

    // C. 安辅助星曜
    const auxStars = [];
    
    // 左辅：辰(4)起正月顺数月
    auxStars.push({ name: "左辅", type: "lucky", branch: (4 + lMonth - 1) % 12 });
    // 右弼：戌(10)起正月逆数月
    auxStars.push({ name: "右弼", type: "lucky", branch: (10 - (lMonth - 1) + 12) % 12 });
    
    // 文昌：戌(10)起子时逆数时
    auxStars.push({ name: "文昌", type: "lucky", branch: (10 - hBranch + 12) % 12 });
    // 文曲：辰(4)起子时顺数时
    auxStars.push({ name: "文曲", type: "lucky", branch: (4 + hBranch) % 12 });

    // 天魁、天钺
    let kui = -1, yue = -1;
    if ([0, 4, 6].includes(yStemIdx)) { kui = 1; yue = 7; }      // 甲戊庚
    else if ([1, 5].includes(yStemIdx)) { kui = 0; yue = 8; }    // 乙己
    else if ([2, 3].includes(yStemIdx)) { kui = 11; yue = 9; }   // 丙丁
    else if (yStemIdx === 7) { kui = 6; yue = 2; }               // 辛
    else if ([8, 9].includes(yStemIdx)) { kui = 3; yue = 5; }    // 壬癸

    auxStars.push({ name: "天魁", type: "lucky", branch: kui });
    auxStars.push({ name: "天钺", type: "lucky", branch: yue });

    // 禄存
    const lucunMap = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
    const lucunIdx = lucunMap[yStemIdx];
    auxStars.push({ name: "禄存", type: "lucky", branch: lucunIdx });

    // 擎羊、陀罗
    auxStars.push({ name: "擎羊", type: "bad", branch: (lucunIdx + 1) % 12 });
    auxStars.push({ name: "陀罗", type: "bad", branch: (lucunIdx - 1 + 12) % 12 });

    // 汇总
    const allStars = [...ziweiStars, ...tianfuStars, ...auxStars];
    
    // D. 标记生辰年干四化
    const sihuaMap = {
      0: { "禄": "廉贞", "权": "破军", "科": "武曲", "忌": "太阳" }, // 甲
      1: { "禄": "天机", "权": "天梁", "科": "紫微", "忌": "太阴" }, // 乙
      2: { "禄": "天同", "权": "天机", "科": "文昌", "忌": "廉贞" }, // 丙
      3: { "禄": "太阴", "权": "天同", "科": "天机", "忌": "巨门" }, // 丁
      4: { "禄": "贪狼", "权": "太阴", "科": "右弼", "忌": "天机" }, // 戊
      5: { "禄": "武曲", "权": "贪狼", "科": "天梁", "忌": "文曲" }, // 己
      6: { "禄": "太阳", "权": "武曲", "科": "太阴", "忌": "天同" }, // 庚
      7: { "禄": "巨门", "权": "太阳", "科": "文曲", "忌": "文昌" }, // 辛
      8: { "禄": "天梁", "权": "紫微", "科": "左辅", "忌": "武曲" }, // 壬
      9: { "禄": "破军", "权": "巨门", "科": "太阴", "忌": "贪狼" }  // 癸
    };

    const currentSihua = sihuaMap[yStemIdx];

    allStars.forEach(star => {
      let suffix = "";
      for (let shKey in currentSihua) {
        if (currentSihua[shKey] === star.name) {
          suffix = ` (化${shKey})`;
        }
      }
      
      if (star.branch !== -1) {
        palaces[star.branch].stars.push({
          name: star.name + suffix,
          rawName: star.name,
          sihua: suffix ? suffix.replace(/[() ]/g, '') : "",
          type: star.type
        });
      }
    });

    // 顺时针网格顺序 (0:寅, 1:卯 ... 11:丑)
    let gridPalaces = [];
    for (let g = 0; g < 12; g++) {
      const bIdx = this.gridToBranch[g];
      gridPalaces.push(palaces[bIdx]);
    }

    const info = {
      name: input.name,
      gender: input.gender,
      solarDate: `${lunar.cYear}年${lunar.cMonth}月${lunar.cDay}日`,
      lunarDate: `${lYear}年${lunar.IMonthCn}${lunar.IDayCn}`,
      timeRange: calendar.Zhi[hBranch] + "时",
      bazi: `${gzYear}年 ${gzMonth}月 ${gzDay}日 ${gzHour}时`,
      phase: phaseName,
      animal: animal,
      isYangYear: isYangStem ? "阳" : "阴",
      isMale: isMale
    };

    return {
      info: info,
      palaces: gridPalaces
    };
  }
};

// 如果是 Node/Browser 模块环境
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calendar, ziwei };
} else {
  window.calendar = calendar;
  window.ziwei = ziwei;
}
