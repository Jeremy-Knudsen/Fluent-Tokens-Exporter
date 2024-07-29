import { VariableCollection, Mode, Variable } from '../types'
import { convertToCSSVariableName } from './processExportFormat'

export async function processMinimizedSet(
  variableCollection: VariableCollection,
  structureMode: Mode,
  valueMode: Mode
): Promise<Record<string, any>> {
  const tokensToExport = await fetchTokensToExport(variableCollection)
  const validTokens = tokensToExport.filter((token): token is Variable => token !== null)
  
  return minimizeTokenSet(validTokens, structureMode.modeId, valueMode.modeId)
}

async function fetchTokensToExport(variableCollection: VariableCollection): Promise<(Variable | null)[]> {
  try {
    return await Promise.all(
      variableCollection.variableIds.map(variableId => 
        figma.variables.getVariableByIdAsync(variableId)
      )
    )
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return []
  }
}

function minimizeTokenSet(tokens: Variable[], structureModeId: string, valueModeId: string): Record<string, any> {
  const tokenTree: Record<string, any> = {}
  const valueMap: Map<string, string[]> = new Map()

  // Build the token tree and value map
  tokens.forEach(token => {
    const structureValue = token.valuesByMode[structureModeId]
    const value = JSON.stringify(token.valuesByMode[valueModeId])
    const cssName = convertToCSSVariableName(token.name)

    if (!valueMap.has(value)) {
      valueMap.set(value, [])
    }
    valueMap.get(value)!.push(cssName)

    let current = tokenTree
    const parts = (typeof structureValue === 'string' ? structureValue : token.name).split('/')
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = { value: token.valuesByMode[valueModeId], original: token.name }
      } else {
        current[part] = current[part] || {}
        current = current[part]
      }
    })
  })

  // Collapse the tree and remove duplicates
  const minimizedTokens: Record<string, any> = {}
  collapseTree(tokenTree, minimizedTokens, valueMap)

  return minimizedTokens
}

function collapseTree(
  tree: Record<string, any>,
  result: Record<string, any>,
  valueMap: Map<string, string[]>,
  prefix: string[] = []
) {
  for (const [key, node] of Object.entries(tree)) {
    if (node.value !== undefined) {
      const value = JSON.stringify(node.value)
      const cssNames = valueMap.get(value) || []
      if (cssNames.length > 0) {
        const shortestName = cssNames.reduce((a, b) => a.length <= b.length ? a : b)
        result[shortestName] = node.value
        valueMap.delete(value)
      }
    } else {
      collapseTree(node, result, valueMap, [...prefix, key])
    }
  }
}

export default processMinimizedSet