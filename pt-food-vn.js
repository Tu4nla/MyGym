window.PT_FOOD_VN = {
  version: 1,
  note: "Calories và macro chỉ là ước tính cho một khẩu phần phổ biến; thay đổi theo lượng cơm/bún, phần thịt, dầu và cách nấu.",
  meals: [
    {id:"bf-pho-bo",type:"breakfast",name:"Phở bò tái nạm",kcal:520,protein:32,carbs:66,fat:14,budget:"$$",time:10,tags:["mua ngoài","dễ ăn"],ingredients:["bánh phở","thịt bò","rau thơm"]},
    {id:"bf-banhmi-egg-milk",type:"breakfast",name:"Bánh mì 2 trứng + sữa tươi",kcal:510,protein:28,carbs:55,fat:20,budget:"$",time:10,tags:["nhanh","dễ mua"],ingredients:["bánh mì","trứng","sữa tươi"]},
    {id:"bf-bunbo",type:"breakfast",name:"Bún bò Huế nhiều thịt, ít giò",kcal:560,protein:34,carbs:68,fat:16,budget:"$$",time:10,tags:["mua ngoài"],ingredients:["bún","thịt bò","rau sống"]},
    {id:"bf-banhcuon",type:"breakfast",name:"Bánh cuốn chả + 1 trứng",kcal:470,protein:24,carbs:60,fat:15,budget:"$",time:10,tags:["mua ngoài"],ingredients:["bánh cuốn","chả lụa","trứng","rau thơm"]},
    {id:"bf-xoi-ga",type:"breakfast",name:"Xôi mặn nhỏ + gà xé + trứng",kcal:540,protein:28,carbs:72,fat:16,budget:"$",time:8,tags:["no lâu"],ingredients:["xôi","thịt gà","trứng"]},
    {id:"bf-hutieu",type:"breakfast",name:"Hủ tiếu Nam Vang nhiều thịt",kcal:520,protein:31,carbs:63,fat:15,budget:"$$",time:10,tags:["mua ngoài"],ingredients:["hủ tiếu","thịt heo","tôm","rau"]},
    {id:"bf-chao",type:"breakfast",name:"Cháo thịt bằm + 2 trứng",kcal:450,protein:29,carbs:48,fat:16,budget:"$",time:15,tags:["dễ tiêu"],ingredients:["gạo","thịt heo nạc","trứng"]},
    {id:"bf-comtam",type:"breakfast",name:"Cơm tấm sườn nướng + trứng, ít mỡ hành",kcal:650,protein:36,carbs:74,fat:22,budget:"$$",time:10,tags:["nhiều năng lượng"],ingredients:["cơm tấm","sườn heo","trứng","dưa leo"]},

    {id:"ln-ga-nuong",type:"lunch",name:"Cơm gà nướng + rau luộc",kcal:620,protein:42,carbs:72,fat:17,budget:"$$",time:15,tags:["cơm tiệm","protein cao"],ingredients:["cơm","thịt gà","rau xanh"]},
    {id:"ln-ca-kho",type:"lunch",name:"Cơm cá basa kho + canh rau",kcal:590,protein:34,carbs:73,fat:18,budget:"$",time:20,tags:["cơm nhà"],ingredients:["cơm","cá basa","rau nấu canh"]},
    {id:"ln-thit-kho",type:"lunch",name:"Cơm thịt nạc kho trứng + rau",kcal:650,protein:38,carbs:70,fat:23,budget:"$",time:25,tags:["cơm nhà"],ingredients:["cơm","thịt heo nạc","trứng","rau xanh"]},
    {id:"ln-bo-xao",type:"lunch",name:"Cơm bò xào rau củ",kcal:630,protein:40,carbs:72,fat:19,budget:"$$",time:20,tags:["protein cao"],ingredients:["cơm","thịt bò","rau củ"]},
    {id:"ln-bun-thit-nuong",type:"lunch",name:"Bún thịt nướng, nhiều thịt, vừa nước mắm",kcal:610,protein:33,carbs:77,fat:19,budget:"$$",time:10,tags:["mua ngoài"],ingredients:["bún","thịt heo nướng","rau sống"]},
    {id:"ln-buncha",type:"lunch",name:"Bún chả + rau sống",kcal:600,protein:35,carbs:75,fat:18,budget:"$$",time:10,tags:["mua ngoài"],ingredients:["bún","thịt heo nướng","rau sống"]},
    {id:"ln-ca-thu",type:"lunch",name:"Cơm cá thu sốt cà + rau",kcal:640,protein:38,carbs:70,fat:22,budget:"$$",time:20,tags:["omega-3"],ingredients:["cơm","cá thu","cà chua","rau xanh"]},
    {id:"ln-canhchua",type:"lunch",name:"Cơm + cá nấu canh chua + trứng luộc",kcal:610,protein:37,carbs:71,fat:19,budget:"$",time:25,tags:["cơm nhà"],ingredients:["cơm","cá","rau canh chua","trứng"]},
    {id:"ln-dauhu-thit",type:"lunch",name:"Cơm đậu hũ sốt thịt bằm + rau",kcal:580,protein:31,carbs:72,fat:18,budget:"$",time:20,tags:["tiết kiệm"],ingredients:["cơm","đậu hũ","thịt bằm","rau xanh"]},
    {id:"ln-comsuon",type:"lunch",name:"Cơm sườn nướng bỏ mỡ + rau + canh",kcal:650,protein:39,carbs:75,fat:21,budget:"$$",time:10,tags:["cơm tiệm"],ingredients:["cơm","sườn heo","rau xanh"]},

    {id:"sn-banana-yogurt",type:"snack",name:"Chuối + sữa chua Hy Lạp",kcal:230,protein:15,carbs:37,fat:3,budget:"$",time:3,tags:["nhanh","dễ tiêu"],ingredients:["chuối","sữa chua Hy Lạp"]},
    {id:"sn-soymilk-eggs",type:"snack",name:"Sữa đậu nành không đường + 2 trứng luộc",kcal:280,protein:22,carbs:13,fat:15,budget:"$",time:8,tags:["protein"],ingredients:["sữa đậu nành","trứng"]},
    {id:"sn-sweetpotato-milk",type:"snack",name:"Khoai lang + sữa tươi",kcal:300,protein:12,carbs:52,fat:6,budget:"$",time:8,tags:["no vừa"],ingredients:["khoai lang","sữa tươi"]},
    {id:"sn-banhmi-mini",type:"snack",name:"Bánh mì thịt mini + sữa chua",kcal:360,protein:20,carbs:48,fat:10,budget:"$",time:5,tags:["mua ngoài"],ingredients:["bánh mì","thịt nạc","sữa chua"]},
    {id:"sn-fruit-milk",type:"snack",name:"Trái cây + sữa tươi + 1 trứng",kcal:290,protein:17,carbs:37,fat:9,budget:"$",time:5,tags:["nhanh"],ingredients:["trái cây","sữa tươi","trứng"]},
    {id:"sn-corn-eggs",type:"snack",name:"Bắp luộc + 2 trứng",kcal:300,protein:17,carbs:35,fat:11,budget:"$",time:8,tags:["tiết kiệm"],ingredients:["bắp","trứng"]},

    {id:"pre-banana-milk",type:"preworkout",name:"Chuối + sữa tươi",kcal:220,protein:10,carbs:37,fat:5,budget:"$",time:3,tags:["pre-workout","dễ tiêu"],ingredients:["chuối","sữa tươi"]},
    {id:"pre-bread-egg",type:"preworkout",name:"1/2 bánh mì + 1 trứng",kcal:230,protein:11,carbs:31,fat:7,budget:"$",time:5,tags:["pre-workout"],ingredients:["bánh mì","trứng"]},
    {id:"pre-rice-chicken",type:"preworkout",name:"Cơm nhỏ + gà xé",kcal:330,protein:24,carbs:43,fat:7,budget:"$",time:8,tags:["pre-workout","protein"],ingredients:["cơm","thịt gà"]},
    {id:"pre-hutieu-half",type:"preworkout",name:"Hủ tiếu phần nhỏ, thêm thịt",kcal:350,protein:22,carbs:47,fat:9,budget:"$$",time:10,tags:["mua ngoài","pre-workout"],ingredients:["hủ tiếu","thịt nạc","rau"]},
    {id:"pre-yogurt-oats",type:"preworkout",name:"Sữa chua + yến mạch + chuối",kcal:310,protein:15,carbs:52,fat:6,budget:"$",time:5,tags:["pre-workout"],ingredients:["sữa chua","yến mạch","chuối"]},

    {id:"dn-chicken-rice",type:"dinner",name:"Cơm + ức gà áp chảo + rau",kcal:610,protein:48,carbs:70,fat:14,budget:"$",time:20,tags:["protein cao","sau tập"],ingredients:["cơm","ức gà","rau xanh"]},
    {id:"dn-pork-boiled",type:"dinner",name:"Cơm + thịt heo nạc luộc + rau",kcal:590,protein:42,carbs:69,fat:16,budget:"$",time:20,tags:["cơm nhà"],ingredients:["cơm","thịt heo nạc","rau xanh"]},
    {id:"dn-fish-steam",type:"dinner",name:"Cơm + cá hấp gừng + rau luộc",kcal:570,protein:40,carbs:68,fat:14,budget:"$$",time:25,tags:["ít dầu"],ingredients:["cơm","cá","gừng","rau xanh"]},
    {id:"dn-beef-veggies",type:"dinner",name:"Cơm + bò xào rau + canh",kcal:640,protein:42,carbs:71,fat:19,budget:"$$",time:20,tags:["protein cao"],ingredients:["cơm","thịt bò","rau xanh"]},
    {id:"dn-egg-pork",type:"dinner",name:"Cơm + trứng thịt bằm + canh cải",kcal:620,protein:35,carbs:68,fat:22,budget:"$",time:20,tags:["tiết kiệm"],ingredients:["cơm","trứng","thịt bằm","cải xanh"]},
    {id:"dn-bunca",type:"dinner",name:"Bún cá + thêm phần cá",kcal:520,protein:36,carbs:65,fat:13,budget:"$$",time:10,tags:["mua ngoài","dễ ăn"],ingredients:["bún","cá","rau"]},
    {id:"dn-mienga",type:"dinner",name:"Miến gà nhiều thịt",kcal:500,protein:35,carbs:61,fat:12,budget:"$$",time:10,tags:["dễ tiêu"],ingredients:["miến","thịt gà","rau thơm"]},
    {id:"dn-khoqua",type:"dinner",name:"Cơm + khổ qua nhồi thịt + trứng",kcal:610,protein:38,carbs:67,fat:20,budget:"$",time:30,tags:["cơm nhà"],ingredients:["cơm","khổ qua","thịt nạc","trứng"]},
    {id:"dn-tofu-beef",type:"dinner",name:"Cơm + đậu hũ non sốt bò bằm + rau",kcal:590,protein:36,carbs:69,fat:18,budget:"$$",time:20,tags:["cơm nhà"],ingredients:["cơm","đậu hũ non","thịt bò bằm","rau xanh"]},
    {id:"dn-shrimp-rice",type:"dinner",name:"Cơm + tôm rang nhạt + trứng + rau",kcal:600,protein:41,carbs:68,fat:18,budget:"$$",time:20,tags:["protein cao"],ingredients:["cơm","tôm","trứng","rau xanh"]}
  ]
};