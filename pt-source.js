window.PT_SOURCE = {
  schemaVersion: 2,
  sourceUpdatedAt: "2026-08-12T22:42:00+07:00",
  sourceOfTruth: "Tu4nla/MyGym",

  profile: {
    sex: "Nam",
    age: 25,
    heightCm: 163,
    weightKg: 59,
    job: "Lập trình viên",
    trainingAge: "Khoảng 2 tháng",
    baselineWeightKg: 53,
    goal: "Body recomposition: giảm vòng bụng, tăng cơ, giữ cân tương đối ổn định",
    preferredGymWindow: "20:00–21:20",
    preferredSleepTime: "23:30"
  },

  // Đây là inventory CANONICAL dùng bởi Personal PT trên mọi thiết bị.
  // Không đọc localStorage để quyết định máy nào có ở gym.
  equipment: {
    mode: "source-controlled",
    confirmedFromCurrentProfile: [
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
    ],
    notes: [
      "Máy đạp đùi được ánh xạ thành 45-Degree Leg Press; máy đạp đùi ngang là Horizontal Leg Press.",
      "Máy đá/móc đùi 2 chức năng được ánh xạ thành Leg Extension / Leg Curl Combo.",
      "Máy ép ngực/vai sau được ánh xạ thành Pec Fly / Rear Delt Machine.",
      "Máy lưng 2 chức năng với nhiều thanh kéo được ánh xạ thành Lat Pulldown / Low Row Combo.",
      "Máy đẩy ngực/vai 3 trong 1 được ánh xạ thành Multi-Press Machine.",
      "Các máy được mô tả chưa đủ đặc trưng để định danh chính xác model vẫn được giữ ở unresolvedEquipment thay vì tự bịa tên máy."
    ],
    unresolvedEquipment: [
      {
        id: "user-back-chest-combo",
        labelVi: "Máy tập lưng/ngực 2 chức năng",
        status: "needs-photo-or-model",
        reason: "Mô tả chức năng chưa đủ để xác định một tên thiết bị vật lý chuẩn duy nhất."
      },
      {
        id: "user-adjustable-angle-chest-press",
        labelVi: "Máy đẩy ngực có ghế điều chỉnh độ",
        status: "provisionally-covered-by-incline-chest-press",
        reason: "Tạm dùng Incline Chest Press cho lập giáo án; cần ảnh/model để biết đây là multi-angle press hay plate-loaded press cụ thể."
      }
    ]
  },

  trainingPolicy: {
    mode: "rolling-sequence",
    preferredStrengthWeekdays: [1, 2, 4, 6],
    sequence: ["upperA", "lowerA", "upperB", "lowerB"],
    rules: {
      missedWorkout: "Không ghép hai buổi tạ vào cùng một ngày để trả nợ. Buổi bị lỡ vẫn là buổi kế tiếp trong chuỗi.",
      partialWorkoutThresholdPct: 60,
      partialWorkoutRule: "Nếu hoàn thành >=60% planned sets và các compound chính đã làm, có thể tính buổi là hoàn thành; không cần đuổi toàn bộ accessory vào hôm sau.",
      lowRecovery: "Ngủ <6 giờ và energy <=2/5: giảm khoảng 20% planned sets, giữ RIR >=2, không cố failure.",
      pain: "Đau bất thường không được tự động xử lý như DOMS: dừng bài gây đau; app không chẩn đoán chấn thương.",
      missedMeal: "Không ăn bù gấp đôi ở bữa sau. Quay lại kế hoạch; ưu tiên đưa protein còn thiếu vào các bữa còn lại nếu vẫn phù hợp tiêu hoá và tổng năng lượng.",
      offPlanMeal: "Không phạt bằng bỏ bữa hoặc cardio quá mức. Ghi nhận, rồi quay lại cấu trúc bữa kế tiếp."
    }
  },

  // Khi người dùng gửi PT update packet trong ChatGPT, các event cần dùng trên mọi thiết bị
  // có thể được commit vào đây. App sẽ merge source events + local events.
  syncedEvents: [],
  syncedMeasurements: [],
  syncedWorkoutSessions: []
};