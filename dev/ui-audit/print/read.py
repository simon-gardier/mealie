import pypdfium2 as pdfium
from pathlib import Path
source=Path("C:/Users/Simon/Downloads/Cr\u00eapes au Sarrasin farcies \u00e0 l'oeuf, fromage et jambon _ la meilleure recette.pdf")
doc=pdfium.PdfDocument(str(source))
print('Pages:',len(doc))
for i,page in enumerate(doc):
 print('PAGE',i+1,page.get_textpage().get_text_range()[:3500])
 page.render(scale=1.3).to_pil().save(f'dev/ui-audit/print/original-{i+1}.png')
