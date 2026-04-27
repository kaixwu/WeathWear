import glob

files = glob.glob('c:/Users/ASUS/Documents/college/bsit 3-2/adet/SunWise/frontend/src/**/*.jsx', recursive=True)
CORRECT = "const API = import.meta.env.VITE_API_URL || \"http://localhost:5000\""

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    count = content.count('const API =')
    changed = False

    if count > 1:
        # Remove ALL const API lines, add back one correct line after last import
        lines = content.split('\n')
        cleaned = [l for l in lines if not l.strip().startswith('const API =')]
        last_import = -1
        for i, l in enumerate(cleaned):
            if l.strip().startswith('import '):
                last_import = i
        if last_import >= 0:
            cleaned.insert(last_import + 1, CORRECT)
            cleaned.insert(last_import + 1, '')
        content = '\n'.join(cleaned)
        changed = True
        print(f'Fixed duplicate: {f.split("/")[-1]}')

    elif count == 1:
        broken = "const API = import.meta.env.VITE_API_URL || API"
        if broken in content:
            content = content.replace(broken, CORRECT)
            changed = True
            print(f'Fixed self-ref: {f.split("/")[-1]}')

    if changed:
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)

print('Done!')
