(() => {
  const F=window.PT_FOOD_VN;
  const V=window.PT_FOOD_V2||{};
  if(!F||!Array.isArray(F.meals)||!V.breakfastBases||!V.products)return;

  const mid=(a,b)=>Math.round(((a+b)/2)*10)/10;
  const products=V.products;
  const candidates=products.filter(x=>x.breakfastCandidate&&x.officeFriendly);
  const officeBases=V.breakfastBases.filter(x=>x.officeFriendly&&x.portable&&x.odor<=1&&x.mess<=1);
  const breakfastMeals=officeBases.map((base,index)=>{
    const baseProtein=mid(base.proteinMin,base.proteinMax);
    const ranked=candidates
      .map(p=>({p,score:Math.abs((baseProtein+p.protein)-28)+(p.proteinRole==="low"&&baseProtein<19?5:0)}))
      .sort((a,b)=>a.score-b.score);
    const pick=ranked[index%Math.min(3,ranked.length)].p;
    const kcalMin=Math.round(base.kcalMin+pick.kcal);
    const kcalMax=Math.round(base.kcalMax+pick.kcal);
    const proteinMin=Math.round((base.proteinMin+pick.protein)*10)/10;
    const proteinMax=Math.round((base.proteinMax+pick.protein)*10)/10;
    return {
      id:`bf-office-${base.id}-${pick.id}`,type:"breakfast",context:"office_commute",
      name:`${base.name} + ${pick.shortName}`,portion:`${base.portion} + ${pick.serving}`,
      kcal:Math.round((kcalMin+kcalMax)/2),kcalMin,kcalMax,
      protein:Math.round(mid(proteinMin,proteinMax)),proteinMin,proteinMax,
      carbs:Math.round(((base.kcalMin+base.kcalMax)/2*.5/4)+(pick.carbs||0)),
      fat:Math.round(((base.kcalMin+base.kcalMax)/2*.3/9)+(pick.fat||0)),
      budget:base.budget==="$$"?"$$":"$",time:base.time,
      tags:["đi làm","ăn tại công ty","office-friendly","gọn","ít mùi",...(base.tags||[]),pick.brand],
      ingredients:[base.name,`${pick.brand} ${pick.name}`],baseId:base.id,productId:pick.id,
      office:true,officeFriendly:true,portable:true,odor:base.odor,mess:base.mess,macroRange:true
    };
  });

  const otherMeals=F.meals.filter(x=>x.type!=="breakfast").map(x=>
    x.id==="sn-banana-yogurt"
      ? {...x,name:"Chuối + sữa chua",kcal:210,protein:6,carbs:36,fat:5,tags:["nhanh","dễ tiêu","đạm thấp"]}
      : x
  );
  Object.assign(F,{
    version:2,updatedAt:"2026-08-13",defaultBreakfastContext:"office_commute",
    note:"Macro món mua ngoài là khoảng ước tính vì lượng nhân, sốt, dầu và kích thước khác nhau. Sản phẩm đóng gói có trường verified để phân biệt số liệu theo nhãn hãng với phần ước tính.",
    breakfastPolicy:{
      label:"Đi làm / ăn tại công ty",targetProtein:"25–30 g",
      rules:["mua nhanh trên đường","mang lên công ty","không cần chế biến","ít mùi","ít dây bẩn"],
      excludedFromDefault:["phở","bún bò","hủ tiếu","cháo","cơm tấm","món nước"]
    },
    breakfastBases:V.breakfastBases,products:V.products,drinks:V.drinks,
    restaurantBreakfasts:V.restaurantBreakfasts,meals:[...breakfastMeals,...otherMeals]
  });
})();