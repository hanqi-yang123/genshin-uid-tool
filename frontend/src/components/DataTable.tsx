import React from 'react';

interface DataTableProps {
  columns: string[];
  data: Record<string, unknown>[];
  title: string;
}

const PERCENT_COLUMNS = new Set(['暴击率', '暴击伤害', '元素充能效率']);

const isPercentAttributeName = (name: string): boolean => {
  if (!name) {
    return false;
  }
  return (
    name.includes('百分比') ||
    name.includes('暴击率') ||
    name.includes('暴击伤害') ||
    name.includes('元素充能效率') ||
    name.includes('加成')
  );
};

const formatValue = (row: Record<string, unknown>, column: string): string => {
  const value = row[column];
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    const fixed = Number.isInteger(value) ? String(value) : value.toFixed(1);

    if (PERCENT_COLUMNS.has(column)) {
      return `${fixed}%`;
    }

    if (column === '主属性数值') {
      const name = String(row['主属性名称'] ?? '');
      return isPercentAttributeName(name) ? `${fixed}%` : fixed;
    }

    const subStatMatch = column.match(/^副属性(\d)数值$/);
    if (subStatMatch) {
      const nameKey = `副属性${subStatMatch[1]}名称`;
      const name = String(row[nameKey] ?? '');
      return isPercentAttributeName(name) ? `${fixed}%` : fixed;
    }

    if (column === '副属性数值') {
      const name = String(row['副属性名称'] ?? '');
      return isPercentAttributeName(name) ? `${fixed}%` : fixed;
    }

    return fixed;
  }

  return String(value);
};

const DataTable: React.FC<DataTableProps> = ({ columns, data, title }) => {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-blue-100/80 bg-blue-50/70 p-5 text-center text-slate-500 shadow-inner">
        暂无{title}数据
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-xl shadow-slate-200/50">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-950/95 via-blue-800/95 to-blue-700/95 text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-[0.15em] md:px-5"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`} className="transition-colors duration-300 hover:bg-blue-50/70">
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="whitespace-nowrap px-4 py-4 font-medium text-slate-700 md:px-5"
                  >
                    {formatValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
