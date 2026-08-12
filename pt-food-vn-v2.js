(()=>{
  const F=window.PT_FOOD_VN;if(!F)return;F.version=2;
  const byId=new Map((F.meals||[]).map(x=>[x.id,x]));
  const patch=(id,p)=>{const x=byId.get(id);if(x)Object.assign(x,p)};
  patch('bf-banhmi-egg-milk',{office:true,tags:['mua trên đường','office-friendly','ít mùi','nhanh']});
  patch('bf-banhcuon',{office:true,tags:['mua trên đường','office-friendly','gọn']});
  patch('bf-xoi-ga',{office:true,tags:['mua trên đường','office-friendly','gọn']});
  patch('bf-comtam',{type:'lunch',tags:['ăn tại quán','nhiều năng lượng']});
  const extra=[
    {id:'bf-banhmi-thit',type:'breakfast',name:'Bánh mì thịt nướng + sữa tươi không đường',kcal:500,protein:28,carbs:57,fat:17,budget:'$',time:6,office:true,tags:['mua trên đường','office-friendly','gọn'],ingredients:['bánh mì','thịt nướng','rau','sữa tươi']},
    {id:'bf-banhmi-cha',type:'breakfast',name:'Bánh mì chả lụa + 2 trứng cút + sữa',kcal:480,protein:25,carbs:55,fat:18,budget:'$',time:5,office:true,tags:['mua trên đường','office-friendly','ít mùi'],ingredients:['bánh mì','chả lụa','trứng cút','sữa']},
    {id:'bf-banhmi-ga',type:'breakfast',name:'Bánh mì gà xé + sữa chua ít đường',kcal:460,protein:30,carbs:54,fat:13,budget:'$',time:6,office:true,tags:['mua trên đường','office-friendly','protein cao'],ingredients:['bánh mì','gà xé','rau','sữa chua']},
    {id:'bf-banhmi-xiumai',type:'breakfast',name:'Bánh mì xíu mại khô + sữa tươi',kcal:510,protein:26,carbs:58,fat:19,budget:'$',time:7,office:true,tags:['mua trên đường','office-friendly','gọn'],ingredients:['bánh mì','xíu mại','sữa tươi']},
    {id:'bf-sandwich-egg',type:'breakfast',name:'Sandwich trứng + ức gà + sữa tươi',kcal:470,protein:32,carbs:49,fat:15,budget:'$$',time:5,office:true,tags:['cửa hàng tiện lợi','office-friendly','ít mùi'],ingredients:['sandwich','trứng','ức gà','sữa']},
    {id:'bf-onigiri-milk',type:'breakfast',name:'2 cơm nắm cá/ngừ + sữa tươi không đường',kcal:470,protein:24,carbs:67,fat:11,budget:'$$',time:4,office:true,tags:['cửa hàng tiện lợi','office-friendly','gọn'],ingredients:['cơm nắm','cá/ngừ','sữa']},
    {id:'bf-banana-yogurt-milk',type:'breakfast',name:'Chuối + sữa chua Hy Lạp + sữa tươi',kcal:360,protein:24,carbs:51,fat:8,budget:'$$',time:3,office:true,tags:['cửa hàng tiện lợi','office-friendly','không mùi'],ingredients:['chuối','sữa chua Hy Lạp','sữa tươi']},
    {id:'bf-oats-yogurt',type:'breakfast',name:'Yến mạch ăn liền + sữa chua Hy Lạp + chuối',kcal:400,protein:23,carbs:62,fat:8,budget:'$',time:5,office:true,tags:['office-friendly','không mùi','meal-prep'],ingredients:['yến mạch','sữa chua Hy Lạp','chuối']},
    {id:'sn-milk-protein',type:'snack',name:'Sữa tươi không đường + sữa chua Hy Lạp',kcal:230,protein:19,carbs:24,fat:7,budget:'$$',time:2,tags:['cửa hàng tiện lợi','nhanh','không mùi'],ingredients:['sữa tươi','sữa chua Hy Lạp']},
    {id:'sn-banhbao-egg',type:'snack',name:'Bánh bao nhân thịt nhỏ + 1 trứng luộc',kcal:350,protein:18,carbs:43,fat:12,budget:'$',time:4,tags:['cửa hàng tiện lợi','mua ngoài'],ingredients:['bánh bao','trứng']},
    {id:'dn-quick-chicken',type:'dinner',name:'Cơm + gà xé sẵn + trứng + rau luộc',kcal:570,protein:43,carbs:66,fat:15,budget:'$',time:10,tags:['sau tập','nấu nhanh','meal-prep'],ingredients:['cơm','gà xé','trứng','rau']},
    {id:'dn-quick-tuna',type:'dinner',name:'Cơm + cá ngừ + 2 trứng + dưa leo',kcal:550,protein:40,carbs:62,fat:16,budget:'$',time:8,tags:['sau tập','nấu nhanh'],ingredients:['cơm','cá ngừ','trứng','dưa leo']},
    {id:'dn-quick-tofu',type:'dinner',name:'Cơm + đậu hũ non + thịt bằm áp chảo',kcal:560,protein:35,carbs:65,fat:18,budget:'$',time:15,tags:['sau tập','nấu nhanh'],ingredients:['cơm','đậu hũ non','thịt bằm']}
  ];
  extra.forEach(x=>{if(!byId.has(x.id)){F.meals.push(x);byId.set(x.id,x)}});
  F.drinks=[
    {id:'drink-water',name:'Nước lọc',kcal:0,caffeine:0,tags:['mặc định','không đường']},
    {id:'drink-sparkling',name:'Nước khoáng có gas không đường',kcal:0,caffeine:0,tags:['không đường']},
    {id:'drink-tea',name:'Trà không đường',kcal:0,caffeine:25,tags:['ít calories']},
    {id:'drink-coffee',name:'Cà phê đen ít/không đường',kcal:10,caffeine:80,tags:['caffeine']},
    {id:'drink-milk',name:'Sữa tươi không đường 180–250ml',kcal:130,caffeine:0,tags:['protein','cửa hàng tiện lợi']},
    {id:'drink-soy',name:'Sữa đậu nành không đường',kcal:110,caffeine:0,tags:['protein thực vật']}
  ];
})();