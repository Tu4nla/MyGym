window.PT_VN_FOODS = {
  version: 1,
  note: "Dinh dưỡng là ước tính theo khẩu phần phổ biến; món ngoài quán có thể lệch đáng kể do lượng dầu, đường, nước chấm và kích thước khẩu phần.",
  slots: [
    { id: "breakfast", label: "Bữa sáng", time: "09:00–09:30", targetKcal: 430, targetProtein: 25 },
    { id: "lunch", label: "Bữa trưa", time: "11:40", targetKcal: 560, targetProtein: 35 },
    { id: "snack", label: "Bữa xế", time: "16:30", targetKcal: 330, targetProtein: 20 },
    { id: "preworkout", label: "Pre-workout nhỏ", time: "19:30", targetKcal: 180, targetProtein: 8 },
    { id: "dinner", label: "Bữa tối sau tập", time: "21:30–21:45", targetKcal: 550, targetProtein: 35 }
  ],
  dishes: [
    { id:"pho-bo", name:"Phở bò tái nạm", slots:["breakfast","lunch"], portion:"1 tô vừa, ưu tiên nhiều thịt", kcal:520, protein:32, carbs:62, fat:16, tags:["ăn ngoài","protein tốt"], ingredients:["bánh phở","thịt bò","hành","rau thơm"] },
    { id:"bun-bo-hue", name:"Bún bò Huế", slots:["breakfast","lunch"], portion:"1 tô vừa, ít giò/chả", kcal:550, protein:34, carbs:66, fat:17, tags:["ăn ngoài","protein tốt"], ingredients:["bún","thịt bò","rau sống","sả"] },
    { id:"hu-tieu-nam-vang", name:"Hủ tiếu Nam Vang", slots:["breakfast","lunch"], portion:"1 tô vừa, thêm thịt/trứng nếu ít topping", kcal:510, protein:30, carbs:63, fat:15, tags:["ăn ngoài","dễ mua"], ingredients:["hủ tiếu","thịt nạc","tôm","trứng","rau giá"] },
    { id:"mien-ga", name:"Miến gà", slots:["breakfast","lunch"], portion:"1 tô vừa, 120–150g thịt gà", kcal:450, protein:33, carbs:52, fat:10, tags:["ăn ngoài","ít dầu","protein tốt"], ingredients:["miến","thịt gà","nấm","hành","rau thơm"] },
    { id:"banh-mi-op-la-sua", name:"Bánh mì ốp la + sữa", slots:["breakfast"], portion:"1 bánh mì nhỏ + 2 trứng + 250ml sữa không đường", kcal:470, protein:27, carbs:53, fat:17, tags:["dễ mua","nhanh"], ingredients:["bánh mì","trứng","sữa tươi"] },
    { id:"banh-cuon-cha-trung", name:"Bánh cuốn chả + trứng", slots:["breakfast"], portion:"1 phần vừa + 1 trứng", kcal:480, protein:27, carbs:60, fat:15, tags:["ăn ngoài","dễ mua"], ingredients:["bánh cuốn","chả lụa","trứng","rau thơm"] },
    { id:"chao-thit-bam-trung", name:"Cháo thịt bằm + 2 trứng", slots:["breakfast"], portion:"1 tô vừa", kcal:455, protein:29, carbs:52, fat:14, tags:["ấm bụng","dễ ăn"], ingredients:["gạo","thịt heo nạc","trứng","hành"] },
    { id:"xoi-ga-xe", name:"Xôi gà xé", slots:["breakfast"], portion:"1 phần nhỏ-vừa, giảm hành phi", kcal:530, protein:29, carbs:72, fat:14, tags:["ăn ngoài","no lâu"], ingredients:["gạo nếp","thịt gà","hành","dưa leo"] },

    { id:"com-ga-luoc", name:"Cơm gà luộc + rau + canh", slots:["lunch","dinner"], portion:"1 chén cơm vừa + 150g gà bỏ da", kcal:590, protein:45, carbs:66, fat:14, tags:["nấu nhanh","protein cao","ít dầu"], ingredients:["gạo","thịt gà","rau xanh","canh rau"] },
    { id:"com-ga-kho-gung", name:"Cơm gà kho gừng", slots:["lunch","dinner"], portion:"1 chén cơm + 150g gà + rau", kcal:620, protein:44, carbs:67, fat:17, tags:["cơm nhà","protein cao"], ingredients:["gạo","thịt gà","gừng","rau xanh"] },
    { id:"com-bo-xao-bong-cai", name:"Cơm bò xào bông cải", slots:["lunch","dinner"], portion:"1 chén cơm + 140g bò + nhiều bông cải", kcal:610, protein:41, carbs:64, fat:18, tags:["nấu nhanh","protein cao"], ingredients:["gạo","thịt bò","bông cải","hành tây"] },
    { id:"com-ca-kho", name:"Cơm cá kho + rau luộc + canh", slots:["lunch","dinner"], portion:"1 chén cơm + 160g cá", kcal:600, protein:39, carbs:66, fat:17, tags:["cơm nhà","protein tốt"], ingredients:["gạo","cá","rau luộc","canh rau"] },
    { id:"com-thit-nac-kho-trung", name:"Cơm thịt nạc kho trứng", slots:["lunch","dinner"], portion:"1 chén cơm + 120g thịt nạc + 1 trứng + rau", kcal:650, protein:40, carbs:65, fat:23, tags:["cơm nhà","dễ nấu"], ingredients:["gạo","thịt heo nạc","trứng","rau xanh"] },
    { id:"com-suon-nuong", name:"Cơm sườn nướng + trứng", slots:["lunch","dinner"], portion:"1 phần cơm vừa, chọn sườn ít mỡ", kcal:690, protein:40, carbs:76, fat:24, tags:["ăn ngoài","dễ mua"], ingredients:["gạo","sườn heo","trứng","dưa leo"] },
    { id:"com-tam-ga", name:"Cơm tấm gà nướng", slots:["lunch","dinner"], portion:"cơm vừa + 150g gà, ít mỡ hành", kcal:640, protein:43, carbs:75, fat:18, tags:["ăn ngoài","protein cao"], ingredients:["gạo tấm","thịt gà","dưa leo","đồ chua"] },
    { id:"bun-cha", name:"Bún chả", slots:["lunch","dinner"], portion:"1 phần vừa, ưu tiên thịt nạc, vừa nước chấm", kcal:610, protein:35, carbs:72, fat:20, tags:["ăn ngoài","dễ mua"], ingredients:["bún","thịt heo nạc","rau sống","đu đủ cà rốt"] },
    { id:"bun-thit-nuong", name:"Bún thịt nướng", slots:["lunch","dinner"], portion:"1 tô vừa, 140g thịt, ít mỡ hành", kcal:620, protein:35, carbs:74, fat:20, tags:["ăn ngoài","dễ mua"], ingredients:["bún","thịt heo","rau sống","đồ chua"] },
    { id:"bun-ca", name:"Bún cá", slots:["lunch","dinner"], portion:"1 tô vừa, thêm cá", kcal:500, protein:34, carbs:61, fat:12, tags:["ăn ngoài","ít dầu","protein tốt"], ingredients:["bún","cá","cà chua","rau thơm"] },
    { id:"bun-rieu-trung", name:"Bún riêu + trứng", slots:["lunch","dinner"], portion:"1 tô vừa + 1 trứng, hạn chế chả chiên", kcal:530, protein:31, carbs:60, fat:18, tags:["ăn ngoài","dễ mua"], ingredients:["bún","riêu cua","đậu hũ","trứng","cà chua"] },
    { id:"canh-chua-ca-com", name:"Canh chua cá + cơm + rau", slots:["lunch","dinner"], portion:"160g cá + 1 chén cơm", kcal:570, protein:39, carbs:67, fat:13, tags:["cơm nhà","ít dầu","protein tốt"], ingredients:["cá","gạo","cà chua","dứa","rau canh chua"] },
    { id:"thit-luoc-banh-trang", name:"Thịt luộc cuốn bánh tráng", slots:["lunch","dinner"], portion:"150g thịt nạc + rau + bánh tráng vừa đủ", kcal:590, protein:40, carbs:55, fat:20, tags:["cơm nhà","nhiều rau"], ingredients:["thịt heo nạc","bánh tráng","rau sống","dưa leo"] },
    { id:"bo-kho-banh-mi", name:"Bò kho + bánh mì", slots:["lunch","dinner"], portion:"1 tô bò kho nhiều thịt + 1/2–1 bánh mì", kcal:620, protein:39, carbs:63, fat:22, tags:["ăn ngoài","protein tốt"], ingredients:["thịt bò","cà rốt","bánh mì","sả"] },
    { id:"ca-basa-ap-chao", name:"Cá basa áp chảo + cơm + rau", slots:["lunch","dinner"], portion:"170g cá + 1 chén cơm", kcal:590, protein:38, carbs:65, fat:18, tags:["nấu nhanh","protein tốt"], ingredients:["cá basa","gạo","rau xanh"] },
    { id:"tom-thit-rim", name:"Tôm thịt rim + cơm + rau", slots:["lunch","dinner"], portion:"120g tôm + 80g thịt nạc + 1 chén cơm", kcal:620, protein:45, carbs:65, fat:18, tags:["cơm nhà","protein cao"], ingredients:["tôm","thịt heo nạc","gạo","rau xanh"] },
    { id:"trung-thit-bam-com", name:"Trứng thịt bằm + cơm + rau", slots:["lunch","dinner"], portion:"2 trứng + 100g thịt nạc + 1 chén cơm", kcal:630, protein:38, carbs:63, fat:23, tags:["nấu nhanh","dễ nấu"], ingredients:["trứng","thịt heo nạc","gạo","rau xanh"] },

    { id:"goi-cuon-tom-thit", name:"Gỏi cuốn tôm thịt", slots:["snack","preworkout"], portion:"3–4 cuốn, vừa nước chấm", kcal:340, protein:25, carbs:43, fat:8, tags:["ăn ngoài","nhẹ bụng","protein tốt"], ingredients:["bánh tráng","tôm","thịt heo nạc","bún","rau sống"] },
    { id:"khoai-trung-sua", name:"Khoai lang + 2 trứng + sữa", slots:["snack"], portion:"150g khoai + 2 trứng + 180–250ml sữa", kcal:390, protein:23, carbs:43, fat:14, tags:["dễ chuẩn bị","no lâu"], ingredients:["khoai lang","trứng","sữa tươi"] },
    { id:"banh-mi-thit-sua", name:"Bánh mì thịt nhỏ + sữa", slots:["snack"], portion:"1 bánh nhỏ nhiều thịt + 180ml sữa", kcal:430, protein:25, carbs:52, fat:14, tags:["ăn ngoài","dễ mua"], ingredients:["bánh mì","thịt heo","dưa leo","sữa tươi"] },
    { id:"banh-bao-thit-sua", name:"Bánh bao thịt + sữa", slots:["snack"], portion:"1 bánh vừa + 180ml sữa", kcal:410, protein:21, carbs:58, fat:11, tags:["dễ mua","nhanh"], ingredients:["bánh bao thịt","sữa tươi"] },
    { id:"bap-trung-sua", name:"Bắp + 2 trứng + sữa", slots:["snack"], portion:"1 trái bắp + 2 trứng + 180ml sữa", kcal:380, protein:22, carbs:38, fat:15, tags:["dễ chuẩn bị","đơn giản"], ingredients:["bắp","trứng","sữa tươi"] },
    { id:"chuoi-sua-chua-sua", name:"Chuối + sữa chua + sữa", slots:["snack","preworkout"], portion:"1 chuối + 1 hũ sữa chua + 180ml sữa", kcal:280, protein:12, carbs:44, fat:7, tags:["nhanh","nhẹ bụng"], ingredients:["chuối","sữa chua","sữa tươi"] },
    { id:"chuoi-sua", name:"Chuối + sữa tươi", slots:["preworkout"], portion:"1 chuối + 180–250ml sữa", kcal:220, protein:9, carbs:36, fat:5, tags:["nhanh","nhẹ bụng"], ingredients:["chuối","sữa tươi"] },
    { id:"khoai-sua", name:"Khoai lang + sữa", slots:["preworkout"], portion:"100g khoai + 180ml sữa", kcal:210, protein:8, carbs:34, fat:5, tags:["dễ chuẩn bị","nhẹ bụng"], ingredients:["khoai lang","sữa tươi"] },
    { id:"banh-mi-trung-nho", name:"1/2 bánh mì + 1 trứng", slots:["preworkout"], portion:"khẩu phần nhỏ", kcal:200, protein:9, carbs:25, fat:7, tags:["dễ mua","nhanh"], ingredients:["bánh mì","trứng"] },
    { id:"sua-dau-nanh-chuoi", name:"Sữa đậu nành + chuối", slots:["preworkout","snack"], portion:"250ml sữa đậu nành ít đường + 1 chuối", kcal:235, protein:10, carbs:39, fat:5, tags:["dễ mua","nhẹ bụng"], ingredients:["sữa đậu nành","chuối"] }
  ],
  weekPlan: {
    0: { breakfast:"mien-ga", lunch:"canh-chua-ca-com", snack:"goi-cuon-tom-thit", preworkout:"chuoi-sua", dinner:"com-ga-kho-gung" },
    1: { breakfast:"banh-mi-op-la-sua", lunch:"com-ga-luoc", snack:"khoai-trung-sua", preworkout:"chuoi-sua", dinner:"com-bo-xao-bong-cai" },
    2: { breakfast:"pho-bo", lunch:"com-ca-kho", snack:"banh-mi-thit-sua", preworkout:"khoai-sua", dinner:"com-ga-kho-gung" },
    3: { breakfast:"banh-cuon-cha-trung", lunch:"com-tam-ga", snack:"goi-cuon-tom-thit", preworkout:"chuoi-sua-chua-sua", dinner:"canh-chua-ca-com" },
    4: { breakfast:"hu-tieu-nam-vang", lunch:"com-bo-xao-bong-cai", snack:"bap-trung-sua", preworkout:"chuoi-sua", dinner:"ca-basa-ap-chao" },
    5: { breakfast:"chao-thit-bam-trung", lunch:"bun-cha", snack:"banh-bao-thit-sua", preworkout:"sua-dau-nanh-chuoi", dinner:"tom-thit-rim" },
    6: { breakfast:"xoi-ga-xe", lunch:"thit-luoc-banh-trang", snack:"khoai-trung-sua", preworkout:"chuoi-sua", dinner:"trung-thit-bam-com" }
  }
};