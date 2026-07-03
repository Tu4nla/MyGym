window.WEREWOLF_ROLES = [
  {
    id: "doppelganger",
    vi: "Kẻ Bắt Chước",
    en: "Doppelganger",
    team: "special",
    order: 1,
    defaultCount: 0,
    description: "Thức dậy đầu tiên, xem bài của một người chơi khác và trở thành vai trò đó."
  },
  {
    id: "werewolf",
    vi: "Ma Sói",
    en: "Werewolf",
    team: "wolf",
    order: 2,
    defaultCount: 2,
    description: "Ma Sói thức dậy và nhìn nhau. Nếu chỉ có một Ma Sói, có thể xem một lá bài ở giữa."
  },
  {
    id: "minion",
    vi: "Tay Sai",
    en: "Minion",
    team: "wolf",
    order: 3,
    defaultCount: 1,
    description: "Biết Ma Sói là ai. Tay Sai thắng cùng phe Sói, dù bản thân không phải Ma Sói."
  },
  {
    id: "mason",
    vi: "Thợ Săn Ma Sói",
    en: "Mason",
    team: "villager",
    order: 4,
    defaultCount: 2,
    description: "Thức dậy để nhìn những Mason khác. Nếu chỉ có một Mason thì không thấy ai."
  },
  {
    id: "seer",
    vi: "Tiên Tri",
    en: "Seer",
    team: "villager",
    order: 5,
    defaultCount: 1,
    description: "Được xem bài của một người chơi hoặc hai lá bài ở giữa."
  },
  {
    id: "robber",
    vi: "Ăn Trộm",
    en: "Robber",
    team: "villager",
    order: 6,
    defaultCount: 1,
    description: "Đổi bài của mình với một người khác, sau đó được xem bài mới của mình."
  },
  {
    id: "troublemaker",
    vi: "Người Gây Rối",
    en: "Troublemaker",
    team: "villager",
    order: 7,
    defaultCount: 1,
    description: "Đổi bài của hai người chơi khác, không được xem hai lá đó."
  },
  {
    id: "drunk",
    vi: "Kẻ Say Xỉn",
    en: "Drunk",
    team: "villager",
    order: 8,
    defaultCount: 1,
    description: "Đổi bài của mình với một lá bài ở giữa, không được xem bài mới."
  },
  {
    id: "insomniac",
    vi: "Cô Bé Mất Ngủ",
    en: "Insomniac",
    team: "villager",
    order: 9,
    defaultCount: 1,
    description: "Thức dậy cuối cùng và được xem lại lá bài hiện tại của mình."
  },
  {
    id: "hunter",
    vi: "Thợ Săn",
    en: "Hunter",
    team: "villager",
    order: 99,
    defaultCount: 1,
    description: "Không thức dậy ban đêm. Nếu Thợ Săn chết, người mà Thợ Săn vote cũng chết."
  },
  {
    id: "tanner",
    vi: "Thằng Chán Đời",
    en: "Tanner",
    team: "tanner",
    order: 99,
    defaultCount: 1,
    description: "Muốn bị treo cổ. Tanner thắng nếu chính Tanner chết."
  },
  {
    id: "villager",
    vi: "Dân Thường",
    en: "Villager",
    team: "villager",
    order: 99,
    defaultCount: 2,
    description: "Không thức dậy ban đêm. Cố gắng tìm và treo Ma Sói."
  }
];
