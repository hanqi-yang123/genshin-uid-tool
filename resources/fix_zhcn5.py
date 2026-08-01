import json

# Read the content
with open('zh-cn.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the double quote issue at the end of line 646
# Current: '    "4275754179": "如狼般狩猎者"",'
# Should be: '    "4275754179": "如狼般狩猎者",'
content = content.replace('"如狼般狩猎者"",', '"如狼般狩猎者",')

with open('zh-cn.json', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed double quote issue")

# Verify the fix
with open('zh-cn.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(f"Successfully loaded! Keys in 'zh-cn': {len(data['zh-cn'])}")
