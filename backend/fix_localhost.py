import glob

files = glob.glob('c:/Users/ASUS/Documents/college/bsit 3-2/adet/SunWise/frontend/src/**/*.jsx', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    original = content

    # Remove ALL const API = ... lines (broken ones)
    lines = content.split('\n')
    cleaned = [l for l in lines if not l.strip().startswith('const API =')]

    # Find last import line index
    last_import = -1
    for i, l in enumerate(cleaned):
        if l.strip().startswith('import '):
            last_import = i

    # Insert one clean, correct const API after last import
    if last_import >= 0:
        cleaned.insert(last_import + 1, 'const API = "http://localhost:5000"')

    content = '\n'.join(cleaned)

    if content != original:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print(f'Fixed: {f.split("/")[-1]}')

print('Done!')
