import pypdfium2 as pdfium
from pathlib import Path
p=Path("C:/Users/Simon/Downloads/Cr\u00eapes au Sarrasin farcies \u00e0 l'oeuf, fromage et jambon _ la meilleure recette.pdf")
d=pdfium.PdfDocument(str(p))
for obj in d[0].get_objects():
 if obj.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE:
  obj.get_bitmap().to_pil().save('dev/ui-audit/print/photo.png')
  break
