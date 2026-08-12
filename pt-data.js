window.PT_DATA = {
  profile: {
    sex: "Nam",
    age: 25,
    heightCm: 163,
    weightKg: 59,
    job: "Lập trình viên",
    goal: "Body recomposition: giảm vòng bụng, tăng cơ, giữ cân tương đối ổn định",
    trainingAge: "Khoảng 2 tháng",
    baselineWeightKg: 53,
    calorieTarget: 2050,
    proteinTarget: 115,
    waterTargetMl: 2500,
    stepsTarget: 8000,
    knownEquipmentFallback: [
      "45-degree-leg-press",
      "horizontal-leg-press",
      "leg-extension-curl-combo",
      "lying-leg-curl",
      "seated-chest-press",
      "incline-chest-press",
      "pec-fly-rear-delt-combo",
      "lat-pulldown",
      "seated-row",
      "lat-pulldown-low-row-combo",
      "multi-press-machine",
      "treadmill",
      "upright-bike"
    ]
  },

  lifestyle: [
    { time: "07:40", title: "Thức dậy", note: "Uống nước, vệ sinh cá nhân." },
    { time: "09:00–09:30", title: "Ăn sáng", note: "Ưu tiên thêm protein thay vì chỉ ăn tinh bột." },
    { time: "11:40", title: "Ăn trưa", note: "Cơm tiệm: 1 phần cơm vừa + thịt/cá + rau." },
    { time: "12:30–13:00", title: "Ngủ trưa", note: "Giữ 20–30 phút." },
    { time: "13:00", title: "Sau ngủ trưa", note: "Ưu tiên nước lọc / đồ uống không đường." },
    { time: "16:30", title: "Bữa xế / pre-workout chính", note: "Bún, hủ tiếu, cơm, bánh mì… nhưng phải có nguồn protein rõ ràng." },
    { time: "19:20", title: "Về nhà", note: "Nghỉ ngắn, uống nước. Nếu đói có thể ăn chuối + sữa/sữa chua." },
    { time: "20:00–21:20", title: "Gym", note: "Tập theo giáo án; ưu tiên chất lượng set và progressive overload." },
    { time: "21:30–21:45", title: "Ăn tối", note: "Khoảng 30–40 g protein + cơm vừa + rau." },
    { time: "23:15", title: "Chuẩn bị ngủ", note: "Giảm màn hình, ánh sáng mạnh." },
    { time: "23:30", title: "Ngủ", note: "Mục tiêu ít nhất 7–8 giờ." }
  ],

  week: {
    0: { type: "recovery", title: "Zone 2 / Nghỉ chủ động", subtitle: "30–45 phút đi bộ nhanh hoặc xe đạp; nghỉ hẳn nếu mệt.", workoutId: null },
    1: { type: "strength", title: "Upper A", subtitle: "Ngực + xô + vai; xây nền sức mạnh.", workoutId: "upperA" },
    2: { type: "strength", title: "Lower A", subtitle: "Đùi trước + đùi sau + core.", workoutId: "lowerA" },
    3: { type: "recovery", title: "Recovery", subtitle: "30–40 phút cardio nhẹ + mobility 5–10 phút.", workoutId: null },
    4: { type: "strength", title: "Upper B", subtitle: "Lưng + vai; duy trì ngực và tay.", workoutId: "upperB" },
    5: { type: "rest", title: "Nghỉ", subtitle: "Đi bộ, đứng dậy vận động sau mỗi 60–90 phút ngồi.", workoutId: null },
    6: { type: "strength", title: "Lower B", subtitle: "Chân + mông + core.", workoutId: "lowerB" }
  },

  meals: [
    {
      id: "breakfast",
      time: "09:00–09:30",
      title: "Bữa sáng",
      target: "25–30 g protein",
      options: [
        "Bánh mì + 2 trứng + 250 ml sữa",
        "Bánh bao + 2 trứng + 1 hộp sữa chua giàu protein",
        "Bắp/ngô + 2 trứng + sữa; không chỉ ăn ngô + trứng nếu hôm đó đói nhanh"
      ]
    },
    {
      id: "lunch",
      time: "11:40",
      title: "Bữa trưa",
      target: "30–35 g protein",
      options: [
        "Cơm tiệm: 1 phần cơm vừa + 1–1.5 lòng bàn tay thịt/cá + rau",
        "Ưu tiên món luộc/kho/nướng; hạn chế món chiên ngập dầu hoặc sốt quá nhiều"
      ]
    },
    {
      id: "snack",
      time: "16:30",
      title: "Bữa xế / pre-workout",
      target: "25–30 g protein + carb",
      options: [
        "Hủ tiếu/bún: chọn tô nhiều thịt, thêm trứng nếu cần",
        "Cơm + thịt/cá + rau",
        "Bánh mì thịt + sữa/sữa chua",
        "Bò lá lốt cuốn bánh tráng: ăn vừa nước chấm và bổ sung đủ thịt"
      ]
    },
    {
      id: "preworkout",
      time: "19:30",
      title: "Pre-workout nhỏ (chỉ khi đói)",
      target: "Nhẹ, dễ tiêu",
      options: [
        "1 quả chuối + sữa chua",
        "1 hộp sữa + trái cây",
        "Bỏ bữa này nếu bữa 16:30 đủ lớn và không đói"
      ]
    },
    {
      id: "dinner",
      time: "21:30–21:45",
      title: "Bữa tối sau tập",
      target: "30–40 g protein",
      options: [
        "150–180 g thịt/cá/gà + 1 phần cơm bình thường + rau",
        "Thịt luộc + trứng + cơm + rau; không cần cắt sạch carb buổi tối",
        "Nếu bữa tối ít thịt, thêm trứng/sữa chua/sữa để đủ protein"
      ]
    }
  ],

  exerciseLibrary: {
    chestPress: {
      name: "Machine Chest Press",
      nameVi: "Đẩy ngực máy",
      primary: "Ngực giữa • tay sau • vai trước",
      equipment: ["seated-chest-press", "multi-press-machine", "iso-lateral-chest-press"],
      setup: ["Chỉnh ghế để tay cầm ngang khoảng giữa ngực.", "Kéo bả vai nhẹ về sau và xuống, chân đặt chắc xuống sàn.", "Cổ tay thẳng, khuỷu không xoè ngang 90°."],
      cues: ["Đẩy tay cầm ra trước nhưng không nhún vai.", "Hạ có kiểm soát đến khi ngực căng, không để stack đập."],
      breathing: "Hít vào khi hạ • thở ra khi đẩy.",
      tempo: "2–1–2",
      avoid: ["Nhấc vai khỏi ghế", "Nảy tạ", "Khoá khuỷu mạnh"]
    },
    inclinePress: {
      name: "Incline Chest Press",
      nameVi: "Đẩy ngực trên",
      primary: "Ngực trên • tay sau • vai trước",
      equipment: ["incline-chest-press", "iso-lateral-incline-press", "multi-press-machine", "adjustable-bench", "fixed-dumbbells"],
      setup: ["Chọn góc dốc vừa, không dựng ghế quá cao.", "Tay cầm/đường đẩy hướng về vùng ngực trên.", "Giữ bả vai ổn định trên tựa lưng."],
      cues: ["Đẩy lên theo quỹ đạo tự nhiên của máy.", "Không biến bài thành shoulder press."],
      breathing: "Hít vào khi hạ • thở ra khi đẩy.",
      tempo: "2–1–2",
      avoid: ["Dốc ghế quá cao", "Nhún vai", "Hạ quá sâu gây khó chịu vai"]
    },
    latPulldownNeutral: {
      name: "Neutral-Grip Lat Pulldown",
      nameVi: "Kéo xô tay trung tính",
      primary: "Xô • lưng trên • tay trước",
      equipment: ["lat-pulldown", "lat-pulldown-low-row-combo", "multi-jungle", "dual-adjustable-pulley", "home-multi-gym"],
      setup: ["Khoá đùi chắc dưới pad.", "Ngực hơi nâng, thân người chỉ ngả nhẹ.", "Ưu tiên tay cầm trung tính/vừa nếu có."],
      cues: ["Nghĩ kéo khuỷu tay xuống phía hông.", "Dừng ngắn khi tay cầm tới vùng ngực trên rồi trả có kiểm soát."],
      breathing: "Thở ra khi kéo • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Giật người", "Kéo sau gáy", "Dùng tay trước làm chủ động tác"]
    },
    latPulldownWide: {
      name: "Medium/Wide-Grip Lat Pulldown",
      nameVi: "Kéo xô tay vừa/rộng",
      primary: "Xô • lưng trên",
      equipment: ["lat-pulldown", "lat-pulldown-low-row-combo", "multi-jungle", "dual-adjustable-pulley", "home-multi-gym"],
      setup: ["Cầm rộng hơn vai vừa phải; không cần cực rộng.", "Khoá đùi, ngực nâng nhẹ."],
      cues: ["Kéo khuỷu xuống và sang hai bên.", "Giữ vai tránh nhún lên sát tai."],
      breathing: "Thở ra khi kéo • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Cầm quá rộng", "Ngửa người nhiều", "Kéo thanh xuống sau gáy"]
    },
    seatedRow: {
      name: "Seated Row",
      nameVi: "Kéo lưng ngồi",
      primary: "Lưng giữa • xô • tay trước",
      equipment: ["seated-row", "lat-pulldown-low-row-combo", "chest-supported-row-machine", "iso-lateral-low-row", "t-bar-row-machine"],
      setup: ["Ngồi vững, ngực mở nhẹ, cột sống trung tính.", "Chọn tay cầm trung tính nếu có."],
      cues: ["Kéo khuỷu ra sau, không chỉ kéo bằng bàn tay.", "Kết thúc khi bả vai co tốt nhưng không ưỡn lưng quá mức."],
      breathing: "Thở ra khi kéo • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Đung đưa thân", "Rướn cổ", "Thả tạ quá nhanh"]
    },
    highRow: {
      name: "High Row",
      nameVi: "Kéo lưng cao",
      primary: "Xô • lưng trên • vai sau",
      equipment: ["high-row", "iso-lateral-high-row", "chest-supported-row-machine", "multi-jungle"],
      setup: ["Chỉnh ghế để tay cầm bắt đầu hơi cao hơn vai.", "Giữ ngực ổn định nếu máy có pad tựa."],
      cues: ["Kéo khuỷu xuống và ra sau.", "Không nhún vai khi kéo."],
      breathing: "Thở ra khi kéo • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Giật người", "Co cổ", "Dùng momentum"]
    },
    shoulderPress: {
      name: "Machine Shoulder Press",
      nameVi: "Đẩy vai máy",
      primary: "Vai trước • vai giữa • tay sau",
      equipment: ["shoulder-press", "iso-lateral-shoulder-press", "multi-press-machine"],
      setup: ["Chỉnh ghế để tay cầm bắt đầu quanh ngang tai/cằm.", "Giữ lưng và mông tựa ghế, bụng gồng vừa."],
      cues: ["Đẩy lên mà không nhún vai.", "Hạ đến biên độ vai cảm thấy ổn."],
      breathing: "Hít vào khi hạ • thở ra khi đẩy.",
      tempo: "2–1–2",
      avoid: ["Ưỡn lưng mạnh", "Hạ quá sâu gây đau vai", "Khoá khuỷu mạnh"]
    },
    lateralRaise: {
      name: "Lateral Raise",
      nameVi: "Dang vai ngang",
      primary: "Vai giữa",
      equipment: ["lateral-raise", "dual-adjustable-pulley", "single-adjustable-pulley", "fixed-dumbbells", "adjustable-dumbbells"],
      setup: ["Giữ thân người ổn định, khuỷu hơi cong.", "Bắt đầu với mức tạ nhẹ hơn bạn nghĩ."],
      cues: ["Nâng cánh tay ra hai bên đến khoảng ngang vai.", "Dẫn chuyển động bằng khuỷu, không nhún cầu vai."],
      breathing: "Thở ra khi nâng • hít vào khi hạ.",
      tempo: "2–1–2",
      avoid: ["Vung người", "Nhún vai", "Tạ quá nặng"]
    },
    rearDelt: {
      name: "Reverse Pec Deck / Rear Delt Fly",
      nameVi: "Ép vai sau",
      primary: "Vai sau • lưng trên",
      equipment: ["pec-fly-rear-delt-combo", "reverse-fly-machine", "dual-adjustable-pulley", "cable-crossover"],
      setup: ["Ngực tựa pad nếu dùng pec deck ngược.", "Tay ngang hoặc hơi thấp hơn vai."],
      cues: ["Mở tay sang hai bên bằng vai sau.", "Giữ ngực trên pad, không giật người."],
      breathing: "Thở ra khi mở • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Kẹp bả vai quá mạnh", "Nhún vai", "Vung tạ"]
    },
    pecDeck: {
      name: "Pec Deck Fly",
      nameVi: "Ép ngực máy",
      primary: "Ngực",
      equipment: ["pec-deck", "pec-fly-rear-delt-combo", "plate-loaded-chest-fly"],
      setup: ["Chỉnh ghế để cánh tay ngang vùng giữa ngực.", "Giữ vai xuống và sau."],
      cues: ["Khép hai cánh tay như ôm một vật lớn.", "Dừng ngắn ở vị trí co nhưng không va stack."],
      breathing: "Thở ra khi ép • hít vào khi mở.",
      tempo: "2–1–2",
      avoid: ["Kéo vai ra trước", "Thả quá sâu", "Dùng momentum"]
    },
    triceps: {
      name: "Cable Triceps Pushdown",
      nameVi: "Kéo cáp tay sau",
      primary: "Tay sau",
      equipment: ["dual-adjustable-pulley", "single-adjustable-pulley", "cable-crossover", "multi-jungle", "home-multi-gym", "triceps-extension", "seated-dip"],
      setup: ["Đứng chắc, khuỷu sát thân.", "Dùng rope/V-bar/thanh thẳng đều được."],
      cues: ["Chỉ duỗi khuỷu, cánh tay trên gần như cố định.", "Duỗi hết trong biên độ thoải mái rồi trả chậm."],
      breathing: "Thở ra khi đẩy xuống • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Đong đưa người", "Khuỷu chạy ra trước", "Dùng vai đè xuống"]
    },
    biceps: {
      name: "Biceps Curl",
      nameVi: "Cuốn tay trước",
      primary: "Tay trước",
      equipment: ["biceps-curl", "preacher-curl-machine", "dual-adjustable-pulley", "single-adjustable-pulley", "fixed-dumbbells", "adjustable-dumbbells"],
      setup: ["Giữ khuỷu tương đối cố định.", "Cổ tay trung tính, không bẻ gập."],
      cues: ["Cuốn lên bằng khuỷu, không hất vai.", "Hạ chậm đến gần duỗi hết."],
      breathing: "Thở ra khi cuốn • hít vào khi hạ.",
      tempo: "2–1–2",
      avoid: ["Vung người", "Đẩy khuỷu ra trước quá nhiều", "Hạ rơi tạ"]
    },
    legPress: {
      name: "Leg Press",
      nameVi: "Đạp đùi",
      primary: "Đùi trước • mông • đùi sau",
      equipment: ["45-degree-leg-press", "horizontal-leg-press", "vertical-leg-press", "leg-press-calf-combo", "hack-squat-leg-press-combo", "squat-press"],
      setup: ["Đặt bàn chân rộng khoảng vai, toàn bộ bàn chân bám mặt đạp.", "Chỉnh ghế để xuống sâu mà lưng dưới vẫn áp tựa."],
      cues: ["Gối đi theo hướng mũi chân.", "Đạp bằng toàn bàn chân, không khoá gối mạnh."],
      breathing: "Hít vào khi hạ • thở ra khi đạp.",
      tempo: "3–0–2",
      avoid: ["Lưng dưới cuộn khỏi ghế", "Gối sập vào trong", "Khoá gối mạnh"]
    },
    legExtension: {
      name: "Leg Extension",
      nameVi: "Đá đùi trước",
      primary: "Đùi trước",
      equipment: ["leg-extension", "leg-extension-curl-combo"],
      setup: ["Trục xoay máy gần trùng với khớp gối.", "Pad nằm trên phần thấp cẳng chân, không đè lên mu bàn chân."],
      cues: ["Duỗi gối có kiểm soát, siết đùi trước ở trên.", "Hạ chậm đến biên độ thoải mái."],
      breathing: "Thở ra khi duỗi • hít vào khi hạ.",
      tempo: "2–1–2",
      avoid: ["Đá bật tạ", "Nhấc mông khỏi ghế", "Dùng mức tạ làm đau gối"]
    },
    legCurl: {
      name: "Leg Curl",
      nameVi: "Móc đùi sau",
      primary: "Đùi sau",
      equipment: ["lying-leg-curl", "seated-leg-curl", "leg-extension-curl-combo", "standing-leg-curl"],
      setup: ["Chỉnh pad đúng vị trí gần cổ chân.", "Giữ hông ổn định theo thiết kế máy."],
      cues: ["Gập gối bằng đùi sau, không giật.", "Siết ngắn ở cuối biên độ rồi trả chậm."],
      breathing: "Thở ra khi móc • hít vào khi trả.",
      tempo: "2–1–2",
      avoid: ["Nhấc hông", "Nảy tạ", "Cắt biên độ vì tạ quá nặng"]
    },
    rdl: {
      name: "Romanian Deadlift",
      nameVi: "RDL – gập hông",
      primary: "Đùi sau • mông • lưng dưới ổn định",
      equipment: ["fixed-dumbbells", "adjustable-dumbbells", "olympic-barbell", "fixed-barbells", "smith-machine"],
      setup: ["Chân rộng bằng hông, gối hơi chùng.", "Giữ tạ sát chân, lưng trung tính."],
      cues: ["Đẩy hông ra sau thay vì ngồi xổm xuống.", "Dừng khi đùi sau căng rõ nhưng lưng vẫn trung tính."],
      breathing: "Hít và brace trước khi hạ • thở ra khi đứng lên.",
      tempo: "3–0–2",
      avoid: ["Cong lưng", "Biến thành squat", "Cố chạm tạ xuống sàn"]
    },
    splitSquat: {
      name: "Bulgarian Split Squat",
      nameVi: "Chùng chân Bulgaria",
      primary: "Đùi trước • mông",
      equipment: ["adjustable-bench", "flat-bench", "fixed-dumbbells", "adjustable-dumbbells", "smith-machine"],
      setup: ["Chân sau kê trên ghế thấp-vừa; chân trước đủ xa để giữ thăng bằng.", "Bắt đầu bodyweight nếu chưa chắc kỹ thuật."],
      cues: ["Hạ thẳng xuống, gối trước theo hướng mũi chân.", "Đẩy qua bàn chân trước để đứng lên."],
      breathing: "Hít vào khi hạ • thở ra khi đứng lên.",
      tempo: "3–0–2",
      avoid: ["Bước quá ngắn", "Gối sập vào trong", "Mất thăng bằng vì tạ quá nặng"]
    },
    hipThrust: {
      name: "Hip Thrust / Glute Drive",
      nameVi: "Đẩy hông – mông",
      primary: "Mông • đùi sau",
      equipment: ["hip-thrust-machine", "smith-machine", "olympic-barbell", "adjustable-bench"],
      setup: ["Đặt điểm tựa/đai đúng vùng hông theo máy.", "Cằm hơi thu, xương sườn giữ xuống."],
      cues: ["Đẩy hông lên bằng mông, không ưỡn lưng dưới.", "Siết mông ở trên rồi hạ có kiểm soát."],
      breathing: "Thở ra khi đẩy hông lên • hít vào khi hạ.",
      tempo: "2–1–2",
      avoid: ["Ưỡn lưng", "Đẩy bằng mũi chân", "Biên độ quá lớn làm mất tư thế"]
    },
    calfRaise: {
      name: "Calf Raise",
      nameVi: "Nhón bắp chân",
      primary: "Bắp chân",
      equipment: ["standing-calf-raise", "seated-calf-raise", "45-degree-leg-press", "horizontal-leg-press", "leg-press-calf-combo"],
      setup: ["Giữ đầu gối theo biến thể đang dùng.", "Đặt phần trước bàn chân chắc trên bệ."],
      cues: ["Hạ gót có kiểm soát để căng bắp chân.", "Nhón lên cao và dừng ngắn."],
      breathing: "Thở tự nhiên, không nín thở kéo dài.",
      tempo: "2–1–2",
      avoid: ["Nảy ở đáy", "Biên độ quá ngắn", "Xoay cổ chân"]
    },
    cableCrunch: {
      name: "Cable Crunch / Ab Crunch",
      nameVi: "Gập bụng cáp / máy",
      primary: "Cơ bụng",
      equipment: ["abdominal-crunch", "dual-adjustable-pulley", "single-adjustable-pulley", "multi-jungle", "home-multi-gym"],
      setup: ["Nếu dùng cable: quỳ/đứng ổn định, rope gần đầu.", "Hông tương đối cố định."],
      cues: ["Gập lồng ngực về phía xương chậu bằng cơ bụng.", "Không biến bài thành kéo bằng tay."],
      breathing: "Thở mạnh ra khi gập • hít vào khi mở.",
      tempo: "2–1–2",
      avoid: ["Kéo bằng tay", "Ngồi hẳn hông ra sau", "Tạ quá nặng"]
    },
    pallof: {
      name: "Pallof Press",
      nameVi: "Chống xoay core",
      primary: "Core chống xoay",
      equipment: ["dual-adjustable-pulley", "single-adjustable-pulley", "cable-crossover", "multi-jungle", "resistance-band"],
      setup: ["Đứng ngang với điểm kéo, hai chân vững.", "Giữ tay trước ngực rồi đẩy thẳng ra."],
      cues: ["Không để thân xoay về phía dây.", "Giữ xương sườn và hông xếp chồng."],
      breathing: "Thở đều trong lúc giữ chống xoay.",
      tempo: "Kiểm soát",
      avoid: ["Xoay hông", "Dùng tạ quá nặng", "Nín thở"]
    },
    reverseCrunch: {
      name: "Reverse Crunch",
      nameVi: "Cuộn bụng ngược",
      primary: "Cơ bụng",
      equipment: ["yoga-mat", "flat-bench", "decline-situp-bench", "ab-crunch-bench"],
      setup: ["Nằm ổn định, gối co.", "Giữ lưng trên yên."],
      cues: ["Cuộn xương chậu lên bằng bụng thay vì chỉ co chân.", "Hạ chậm không thả rơi chân."],
      breathing: "Thở ra khi cuộn • hít vào khi hạ.",
      tempo: "2–1–2",
      avoid: ["Vung chân", "Ưỡn lưng dưới", "Làm quá nhanh"]
    },
    sidePlank: {
      name: "Side Plank",
      nameVi: "Plank nghiêng",
      primary: "Core bên • ổn định hông",
      equipment: ["yoga-mat"],
      setup: ["Khuỷu ngay dưới vai.", "Cơ thể tạo đường thẳng từ đầu đến chân/gối."],
      cues: ["Đẩy sàn ra, giữ hông không rơi.", "Thở đều."],
      breathing: "Thở đều xuyên suốt set.",
      tempo: "Giữ tĩnh",
      avoid: ["Rơi hông", "Nhún vai", "Nín thở"]
    }
  },

  workouts: {
    upperA: {
      title: "Upper A",
      duration: "75–85 phút",
      focus: "Ngực • Xô • Vai",
      exercises: [
        ["chestPress", 3, "6–10", 2, 150],
        ["latPulldownNeutral", 3, "8–12", 2, 120],
        ["inclinePress", 3, "8–12", 2, 120],
        ["seatedRow", 3, "8–12", 2, 120],
        ["lateralRaise", 3, "12–20", "1–2", 75],
        ["rearDelt", 2, "12–20", "1–2", 75],
        ["triceps", 2, "10–15", "1–2", 75],
        ["biceps", 2, "10–15", "1–2", 75]
      ]
    },
    lowerA: {
      title: "Lower A",
      duration: "70–80 phút",
      focus: "Đùi trước • Đùi sau • Core",
      exercises: [
        ["legPress", 3, "8–12", 2, 150],
        ["legExtension", 3, "10–15", "1–2", 90],
        ["legCurl", 3, "10–15", "1–2", 90],
        ["rdl", 2, "8–12", "2–3", 120],
        ["calfRaise", 3, "10–15", "1–2", 90],
        ["cableCrunch", 3, "10–15", "1–2", 75],
        ["pallof", 2, "10–15 mỗi bên", 2, 60]
      ]
    },
    upperB: {
      title: "Upper B",
      duration: "75–85 phút",
      focus: "Lưng • Vai • Ngực",
      exercises: [
        ["shoulderPress", 3, "6–10", 2, 150],
        ["latPulldownWide", 3, "8–12", 2, 120],
        ["highRow", 3, "8–12", 2, 120],
        ["chestPress", 3, "8–12", 2, 120],
        ["pecDeck", 2, "10–15", "1–2", 90],
        ["rearDelt", 2, "12–20", "1–2", 75],
        ["lateralRaise", 2, "12–20", "1–2", 75],
        ["biceps", 2, "10–15", "1–2", 75],
        ["triceps", 2, "10–15", "1–2", 75]
      ]
    },
    lowerB: {
      title: "Lower B",
      duration: "70–85 phút",
      focus: "Chân • Mông • Core",
      exercises: [
        ["legPress", 3, "10–15", 2, 150],
        ["splitSquat", 2, "8–12 mỗi chân", 2, 120],
        ["legCurl", 3, "10–15", "1–2", 90],
        ["legExtension", 2, "12–15", "1–2", 90],
        ["hipThrust", 3, "8–12", 2, 120],
        ["calfRaise", 3, "10–15", "1–2", 90],
        ["reverseCrunch", 3, "10–15", "1–2", 75],
        ["sidePlank", 2, "30–45 giây mỗi bên", "—", 60]
      ]
    }
  }
};