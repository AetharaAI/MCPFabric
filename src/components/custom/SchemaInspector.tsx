import { useState } from 'react';
import { ChevronRight, ChevronDown, Type, Braces, List, Hash, ToggleLeft, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaInspectorProps {
  schema: Record<string, unknown>;
  name?: string;
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  string: Quote,
  number: Hash,
  integer: Hash,
  boolean: ToggleLeft,
  array: List,
  object: Braces
};

const typeColors: Record<string, string> = {
  string: 'text-amber-400',
  number: 'text-cyan-400',
  integer: 'text-cyan-400',
  boolean: 'text-purple-400',
  array: 'text-teal-400',
  object: 'text-zinc-400'
};

function SchemaProperty({ 
  name, 
  value, 
  depth = 0 
}: { 
  name: string; 
  value: unknown; 
  depth?: number 
}) {
  const [expanded, setExpanded] = useState(false);
  
  if (typeof value !== 'object' || value === null) {
    const Icon = typeIcons[typeof value] || Type;
    const colorClass = typeColors[typeof value] || 'text-zinc-400';
    
    return (
      <div 
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        <span className="text-sm font-medium text-zinc-300">{name}</span>
        <span className="text-xs text-zinc-500">:</span>
        <span className={cn('text-sm', colorClass)}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = Object.entries(value as Record<string, unknown>);
  const hasChildren = entries.length > 0;
  
  const schemaValue = value as Record<string, unknown>;
  const propertyType = (schemaValue.type as string) || (isArray ? 'array' : 'object');
  const Icon = typeIcons[propertyType] || (isArray ? List : Braces);
  const colorClass = typeColors[propertyType] || 'text-zinc-400';

  return (
    <div>
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 rounded"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className={cn('w-3.5 h-3.5', colorClass)} />
        <span className="text-sm font-medium text-zinc-300">{name}</span>
        {'type' in schemaValue && typeof schemaValue.type === 'string' && (
          <>
            <span className="text-xs text-zinc-500">:</span>
            <span className={cn('text-xs', colorClass)}>{schemaValue.type}</span>
          </>
        )}
        {'description' in schemaValue && typeof schemaValue.description === 'string' && (
          <span className="text-xs text-zinc-600 truncate max-w-xs">
            {'// ' + schemaValue.description}
          </span>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="border-l border-zinc-800 ml-4">
          {entries.map(([key, val]) => (
            <SchemaProperty 
              key={key} 
              name={key} 
              value={val} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaInspector({
  schema,
  name = 'root',
  expandable = true,
  defaultExpanded = false,
  className
}: SchemaInspectorProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn(
      'bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden',
      className
    )}>
      {/* Header */}
      <div 
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b border-zinc-800',
          expandable && 'cursor-pointer hover:bg-zinc-900'
        )}
        onClick={() => expandable && setExpanded(!expanded)}
      >
        {expandable && (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )
        )}
        <Braces className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-zinc-200">{name}</span>
        <span className="text-xs text-zinc-500">schema</span>
      </div>

      {/* Content */}
      {(expanded || !expandable) && (
        <div className="p-3 font-mono text-sm">
          {Object.entries(schema).map(([key, value]) => (
            <SchemaProperty key={key} name={key} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}
