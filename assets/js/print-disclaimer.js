const disclaimer = document.createElement('aside');
disclaimer.className = 'office-print-disclaimer';
disclaimer.setAttribute('role', 'note');
disclaimer.innerHTML = '<strong>إخلاء مسؤولية مكتب عماد عدن العقاري:</strong> هذا التقرير أو النموذج إرشادي ومعدّ وفق البيانات والمستندات المتاحة وقت إصداره. لا يُعد سند ملكية، أو ضمانًا لصحة المستندات أو سلامة الصفقة، أو تعهدًا بتحقق سعر أو نتيجة محددة، ولا يغني عن المعاينة والتحقق الرسمي والاستشارة القانونية أو الهندسية عند الحاجة. يتحمل المستخدم مسؤولية قراراته والتزاماته المبنية عليه، ولا يستبعد هذا التنبيه أي مسؤولية يقررها القانون.';
document.body.appendChild(disclaimer);
