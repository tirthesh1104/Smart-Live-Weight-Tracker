import os
import re

search_dir = "src"
patterns = [
    r'mock',
    r'dummy',
    r'sample_train',
    r'12951',
    r'CSMT',
    r'fake',
    r'SIMULATED',
    r'generateMock',
    r'sampleTrains'
]

results = {}

for root, dirs, files in os.walk(search_dir):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.json', '.js')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                for idx, line in enumerate(lines):
                    for p in patterns:
                        if re.search(p, line, re.IGNORECASE):
                            if path not in results:
                                results[path] = []
                            results[path].append((idx + 1, line.strip()))
                            break

print(f"Files with potential mock/dummy patterns: {len(results)}")
for p, matches in list(results.items())[:20]:
    print(f"\n{p} ({len(matches)} matches):")
    for lno, text in matches[:4]:
        print(f"  L{lno}: {text[:100]}")
