import json

with open('zh-cn.json', 'r', encoding='utf-8') as f:
    content = f.read()

# The file should be:
# {
#   "zh-cn": {
#     ...entries...
#   }
# }

# Find the last entry line (before the inner })
last_entry_line = content.rfind('"4275754179": "如狼般狩猎者"')
if last_entry_line != -1:
    # Check if it has a comma
    after_last_entry = content[last_entry_line:]
    comma_pos = after_last_entry.find('",\n')
    if comma_pos == -1:
        # No comma, add it
        content = content[:last_entry_line + len('"4275754179": "如狼般狩猎者"')] + '",' + content[last_entry_line + len('"4275754179": "如狼般狩猎者"'):]
        print("Added comma to last entry")

# Now ensure proper closing
lines = content.split('\n')
print(f"Total lines after fix: {len(lines)}")
print(f"Last 5 lines:")
for i, line in enumerate(lines[-5:]):
    print(f"  {len(lines)-4+i}: {repr(line)}")

# Write back
with open('zh-cn.json', 'w', encoding='utf-8') as f:
    f.write(content)

# Try to load
try:
    with open('zh-cn.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Successfully loaded. Keys in 'zh-cn': {len(data['zh-cn'])}")
except Exception as e:
    print(f"Error: {e}")
