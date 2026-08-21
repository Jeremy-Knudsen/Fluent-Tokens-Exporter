//--------------------------------------------------------------------------------

// A loop that for each selected node, change each of its boundVariables.fills (variable like in figma.variable NOT style) to use the local variable that has the same name
// figma.currentPage.selection.forEach((node) => {
//   if (node.boundVariables && node.boundVariables.fills) {
//     node.boundVariables.fills.forEach((fill) => {
//       const variable = figma.variables.getLocalVariables().find((variable) => {
//         return variable.name === fill.name;
//       });
//       if (variable) {
//         fill.id = variable.id;
//       }
//     });
//   }
// });

//--------------------------------------------------------------------------------

// function generateColorTable(modes) {
//   // Create an array to store the table data
//   let tableData = [];

//   // Loop over each selected node
//   for (const node of figma.currentPage.selection) {
//     // Check if the node has bound variables
//     if (node.boundVariables && node.boundVariables.fills) {
//       // Loop over each fill variable
//       for (const fill of node.boundVariables.fills) {
//         // Retrieve the value of the fill variable for each mode
//         const variable = figma.variables.getVariableById(fill.id);
//         const modeCollection = figma.variables.getLocalVariableCollections()[0];

//         const modeValues = {};

//         for (const mode of modes) {
//           const foundMode = modeCollection.modes.find((modesInCollection) => {
//             return modesInCollection.name === mode;
//           });

//           const modeId = foundMode ? foundMode.modeId : null;
//           modeValues[mode] = variable ? variable.valuesByMode[modeId || ''] : null;
//         }

//         // Function to convert RGBA to Hex
//         function rgbaToHex(rgba) {
//           let r = Math.round(rgba.r * 255).toString(16);
//           let g = Math.round(rgba.g * 255).toString(16);
//           let b = Math.round(rgba.b * 255).toString(16);
//           let a = Math.round(rgba.a * 255).toString(16);

//           r = r.length === 1 ? '0' + r : r;
//           g = g.length === 1 ? '0' + g : g;
//           b = b.length === 1 ? '0' + b : b;
//           a = a.length === 1 ? '0' + a : a;

//           // If alpha is FF (100% opacity), return the 6-digit hex format
//           if (a === 'ff') {
//             return ('#' + r + g + b).toUpperCase();
//           } else {
//             return ('#' + r + g + b + a).toUpperCase() + ` (${Math.round(rgba.a * 100)}% opacity)`;
//           }
//         }

//         // Add a row to the table data
//         tableData.push({
//           'Layer Name': node.name,
//           ...Object.fromEntries(Object.entries(modeValues).map(([mode, value]) => [`${mode} Value (Hex)`, value ? rgbaToHex(value) : 'N/A']))
//         });
//       }
//     }
//   }

//   // Output the table data
//   console.table(tableData);
// }

// // Call the function
// generateColorTable(['Dark Mode', 'Light Mode']);

//--------------------------------------------------------------------------------

// Function to convert RGBA to Hex
function rgbaToHex(rgba) {
  let r = Math.round(rgba.r * 255).toString(16);
  let g = Math.round(rgba.g * 255).toString(16);
  let b = Math.round(rgba.b * 255).toString(16);
  let a = Math.round(rgba.a * 255).toString(16);

  r = r.length === 1 ? "0" + r : r;
  g = g.length === 1 ? "0" + g : g;
  b = b.length === 1 ? "0" + b : b;
  a = a.length === 1 ? "0" + a : a;

  // If alpha is FF (100% opacity), return the 6-digit hex format
  if (a === "ff") {
    return ("#" + r + g + b).toUpperCase();
  } else {
    return (
      ("#" + r + g + b + a).toUpperCase() +
      ` (${Math.round(rgba.a * 100)}% opacity)`
    );
  }
}

async function replaceColorValue(node, layerName, modeValues, variableName) {
  console.log("layerName", layerName);
  console.log("modeValues", modeValues);
  if (
    node.name === layerName &&
    node.type === "TEXT" &&
    node.type !== "SYMBOL"
  ) {
    console.log(
      `maint.ts - replaceColorValue - ${layerName} node found: `,
      node
    );
    await figma.loadFontAsync(node.fontName);
    // Format the variableName
    let formattedVariableName = `--cib-color-${variableName
      .toLowerCase()
      .replace(/\//g, "-")
      .replace(/ /g, "-")})`;
    node.characters = `Light: ${
      modeValues["Light Mode"] ? rgbaToHex(modeValues["Light Mode"]) : "N/A"
    }\nDark: ${
      modeValues["Dark Mode"] ? rgbaToHex(modeValues["Dark Mode"]) : "N/A"
    }\n${formattedVariableName}`;
  }

  if (node.children) {
    console.log("children found");
    for (const child of node.children) {
      await replaceColorValue(child, layerName, modeValues, variableName);
    }
  }
}
async function generateColorTable(modes) {
  // Create an array to store the table data
  let tableData = [];

  // Loop over each selected node
  for (const node of [...figma.currentPage.selection].reverse()) {
    // Check if the node has bound variables
    if (node.boundVariables && node.boundVariables.fills) {
      // Loop over each fill variable
      for (const fill of node.boundVariables.fills) {
        // Retrieve the value of the fill variable for each mode
        const variable = await figma.variables.getVariableByIdAsync(fill.id);
        const modeCollection = (
          await figma.variables.getLocalVariableCollectionsAsync()
        )[0];

        const modeValues = {};

        for (const mode of modes) {
          const foundMode = modeCollection.modes.find((modesInCollection) => {
            return modesInCollection.name === mode;
          });

          const modeId = foundMode ? foundMode.modeId : null;
          modeValues[mode] = variable
            ? variable.valuesByMode[modeId || ""]
            : null;
        }

        // Add a row to the table data
        tableData.push({
          "Layer Name": node.name,
          ...Object.fromEntries(
            Object.entries(modeValues).map(([mode, value]) => [
              `${mode}`,
              value ? rgbaToHex(value) : "N/A",
            ])
          ),
        });

        // Find the child TextNode named "Color value" and replace its content
        await replaceColorValue(node, "Color value", modeValues, variable.name);
      }
    }
  }

  // Output the table data
  console.table(tableData);
}
// Call the function
generateColorTable(["Dark Mode", "Light Mode"]);

//--------------------------------------------------------------------------------

// function removeVariablesFromSelection() {
//   const selectedNodes = figma.currentPage.selection;

//   for (const node of selectedNodes) {
//     node.explicitVariableModes = {};
//     node.boundVariables = {};
//   }
// }

// // Usage:
// removeVariablesFromSelection();

//--------------------------------------------------------------------------------

// // for each selected text node, load its font async, then renames the text node layer name to a specified text string
//   async function changeTextContent(newText) {
//     const selectedNodes = figma.currentPage.selection;

//     for (const node of selectedNodes) {
//       if (node.type === "TEXT") {
//         await figma.loadFontAsync(node.fontName);
//         node.characters = newText;
//         node.hyperlink = null;
//       }
//     }
//   }

// Usage:
// await changeTextContent("New Text Content");

//--------------------------------------------------------------------------------

// function to clear all guides on the page and on every frame on the page
function clearGuides() {
  const page = figma.currentPage;
  const frames = page.children.filter((child) => child.type === "FRAME");
  const allNodes = [page, ...frames];
  for (const node of allNodes) {
    node.guides = [];
  }
}

// Call the function
clearGuides();

//--------------------------------------------------------------------------------

// // for each selected node, copy the remote fill styles to the local styles with the same style name
// function copyRemoteToLocalStyles(whichStylesToCopy) {
//   const selection = figma.currentPage.selection;

//   selection.forEach(node => {
//     if (whichStylesToCopy.includes("fills") && node.fills && Array.isArray(node.fills)) {
//       const fillStyleId = node.fillStyleId;
//       const fillStyle = figma.getStyleById(fillStyleId)
//       if (fillStyle) {
//         const fillStyleName = fillStyle.name;

//         // create a new style with the same name as the remote style and use the paints from the remote style
//         let newStyle = figma.createPaintStyle();
//         newStyle.name = fillStyleName;
//         newStyle.paints = fillStyle.paints;
//       }
//     }

//     if (whichStylesToCopy.includes("effects") && node.effects && Array.isArray(node.effects)) {
//       const effectStyleId = node.effectStyleId;
//       const effectStyle = figma.getStyleById(effectStyleId)
//       if (effectStyle) {
//         const effectStyleName = effectStyle.name;

//         // create a new style with the same name as the remote style and use the effects from the remote style
//         let newStyle = figma.createEffectStyle();
//         newStyle.name = effectStyleName;
//         newStyle.effects = effectStyle.effects;
//       }
//     }
//   });
// }

// // Call the function
// copyRemoteToLocalStyles(["fills", "effects"]);

//--------------------------------------------------------------------------------

async function createFramesWithTextNodes() {
  // Get the currently selected nodes
  const selectedNodes = figma.currentPage.selection;

  // Loop over each selected node
  for (const node of selectedNodes) {
    // Check if the node is a frame
    if (node.type === "FRAME") {
      // Create a new frame inside the current frame
      const newFrame = figma.createFrame();
      newFrame.fills = []; // Set the fills property to an empty array
      newFrame.resize(node.width, node.height); // Set the width and height to match the original node
      newFrame.layoutMode = "VERTICAL"; // Set the layout mode to vertical
      newFrame.primaryAxisSizingMode = "AUTO"; // Set the primary axis sizing mode to auto
      newFrame.itemSpacing = 16; // Set the item spacing to 16
      newFrame.paddingLeft = 16; // Set the left padding to 16
      newFrame.paddingRight = 16; // Set the right padding to 16
      newFrame.paddingTop = 16; // Set the top padding to 16
      newFrame.paddingBottom = 16; // Set the bottom padding to 16
      node.appendChild(newFrame);

      // Check if the frame has a fill variable
      if (node.boundVariables && node.boundVariables["fills"]) {
        // Get the fill variable
        const fillVariable = await figma.variables.getVariableByIdAsync(
          node.boundVariables["fills"][0].id
        );

        // Check if fillVariable is not null
        if (fillVariable) {
          // Load the font
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });

          // Create a text node for the fill variable name
          const textNode1 = figma.createText();
          textNode1.characters = fillVariable.name;
          newFrame.appendChild(textNode1);

          // For each `fillVariable.valuesByMode`, create a text node for that contains the value
          for (const [mode, value] of Object.entries(
            fillVariable.valuesByMode
          )) {
            // Create a text node for the fill variable value
            const textNode2 = figma.createText();
            textNode2.characters = value
              ? `Mode: ${mode}, Value: ${rgbaToHex(value)}`
              : `Mode: ${mode}, Value: N/A`;
            newFrame.appendChild(textNode2);
          }
        }
      }
    }
  }
}

// Call the function
createFramesWithTextNodes();

//--------------------------------------------------------------------------------

// // Create a function that passes a variable name or partial variable name and logs the variable object in the console and selects all nodes on the current page that have the variable applied to it
// function findVariable(variableName) {
//   let variable = figma.variables.getLocalVariables().find((variable) => {
//     return variable.name.toLowerCase().includes(variableName.toLowerCase());
//   });
//   console.log(`FOUND! Variable ${variableName}: `, variable);
//   if (variable) {
//     let nodes = figma.currentPage.findAll((node) => {
//       return node.boundVariables && node.boundVariables.fills && node.boundVariables.fills.some((fill) => {
//         return fill.id === variable.id;
//       });
//     });
//     figma.currentPage.selection = nodes;
//     if (nodes.length > 0) {
//       figma.viewport.scrollAndZoomIntoView(nodes);
//     }
//   }
// }
// // Call the function
// findVariable("selector");

//----------------------------------------------------------------------------------

// A loop that for each node, looks up its local variable name (assuming there is only one applied to it) and sets the name of the fill style id on the node to the name of the variable id on the node, but with the string "Light/" prepended to the name
// figma.currentPage.selection.forEach((node) => {
//   let variableId = node.boundVariables.fills[0].id;
//   let variable = figma.variables.getVariableById(variableId);
//   let variableName = variable.name;
//   let fillStyleId = node.fillStyleId;
//   let fillStyle = figma.getStyleById(fillStyleId);
//   fillStyle.name = "Light/" + variableName;
// });

//---------------------------------------------------------------------------------------------

// // Make a local copy of the fill style of the selected node, replacing the previx "Light Mode" with "Light"
// figma.currentPage.selection.forEach((node) => {
//   let fillStyleId = node.fillStyleId;
//   let fillStyle = figma.getStyleById(fillStyleId);
//   // get key of fillStyle
//   let fillStyleKey = fillStyle.key;
//   // import fillStyle by key asynchronously
//   figma.importStyleByKeyAsync(fillStyleKey).then((fillStyleCopy) => {
//     let variableId = node.boundVariables.fills[0].id;
//     let variable = figma.variables.getVariableById(variableId);
//     let variableName = variable.name;
//     let fillStyleCopyId = fillStyleCopy.id;
//     let fillstyleCopy2 = figma.getStyleById(fillStyleCopyId);
//     fillStyleCopy2.name = fillStyleCopy.name.replace("Light Mode", "Light");
//   });
// });

//---------------------------------------------------------------------------------------------

// A loop that for each text node, loads its font async, then removes the " epx" string stuffix from the text content
// figma.currentPage.selection.forEach((node) => {
//   if (node.type === "TEXT") {
//     let fontName = node.fontName;
//     figma.loadFontAsync(fontName).then(() => {
//       let text = node.characters;
//       let newText = text.replace(" epx", "");
//       node.characters = newText;
//     });
//   }
// });

//---------------------------------------------------------------------------------------------

// a function that loops through the selected text nodes to find any text node that has a letter spacing that is not equal to 0 and then selects those nodes
// function findLetterSpacing() {
//   let nodes = figma.currentPage.selection;
//   let selectedNodes = nodes.filter((node) => {
//     return node.type === "TEXT" && node.letterSpacing.value !== 0;
//   });
//   figma.currentPage.selection = selectedNodes;
//   if (selectedNodes.length > 0) {
//     figma.viewport.scrollAndZoomIntoView(selectedNodes);
//   }
// }
// // Call the function
// findLetterSpacing();

// A loop that fore each text node, loads its font async, then renames the text node layer name to the size + font name + font weight + ", " + if Regular, "400" if Medium, "500" if Semibold, "600" if Bold, "700" if Black, "800"
// figma.currentPage.selection.forEach((node) => {
//   if (node.type === "TEXT") {
//     let fontName = node.fontName;
//     let fontSize = node.fontSize;
//     let fontStyle = fontName.style;
//     let fontWeight = node.fontWeight;
//     // make fontStyle title case, making the first character of every word uppercase
//     fontStyle = fontStyle.split(" ").map((word) => {
//       return word.charAt(0).toUpperCase() + word.slice(1);
//     }).join(" ");

//     figma.loadFontAsync(fontName).then(() => {
//       node.name = fontSize + " " + fontName.family + " " + fontStyle + ", " + fontWeight;
//       node.characters = node.name;
//     });
//   }
// });

//---------------------------------------------------------------------------------------------

// A loop that for each text node, renames its text style name to be the same as the text node layer name
// figma.currentPage.selection.forEach((node) => {
//   if (node.type === "TEXT") {
//     let textStyleName = "iOS / " + node.name;
//     let textStyle = figma.getStyleById(node.textStyleId)
//     textStyle.name = textStyleName;
//   }
// });

//---------------------------------------------------------------------------------------------

// A loop that for each text node, applies the local style that has the same name as the text node layer name with the string "Bing + Android/" prepended to the name
// figma.currentPage.selection.forEach((node) => {
//   if (node.type === "TEXT") {
//     let textStyleName = "Bing + Android/" + node.name;
//     let textStyle = figma.getLocalTextStyles().find((textStyle) => {
//       return textStyle.name === textStyleName;
//     });
//     if (textStyle) {
//       let textStyleId = textStyle.id;
//       node.textStyleId = textStyleId;
//     }
//   }
// });

//---------------------------------------------------------------------------------------------

// A loop that for each text node, loads its font async, then renames the text node layer name to the size + font name + font weight + ", " + if Regular, "400" if Medium, "500" if Semibold, "600" if Bold, "700" if Black, "800"
// figma.currentPage.selection.forEach((node) => {
//   if (node.type === "TEXT") {
//     let fontName = node.fontName;
//     let content = "–";

//     figma.loadFontAsync(fontName).then(() => {
//       node.characters = content;
//     });
//   }
// });

//---------------------------------------------------------------------------------------------

// A loop that for each local paint style in figma.getLocalPaintStyles(), creates a copy of the style using slice then sets the boundVariables property value of the copied style to be an empty object, and then runs an inner loop that for each node in the current page that has the same style name, applies the new style to the node, and lastly, deletes the original style AFTER the inner loop
// figma.getLocalPaintStyles().forEach((style) => {
//   let styleName = style.name;
//   let styleId = style.id;
//   let styleCopy = figma.createPaintStyle();
//   // copy all properties of style to styleCopy EXCEPT for the id, and set the boundVariables property value of the copied style to be an empty object
//   styleCopy.name = styleName;
//   styleCopy.paints.map((paint) => {
//     if (paint.type === "SOLID") {
//       const newBoundVariables = {};
//       paint = { ...paint, boundVariables: newBoundVariables };
//     }
//   });
//   figma.currentPage.selection.forEach((node) => {
//     if (node.type !== "SLICE" && node.type !== "GROUP" && node.type !== "BOOLEAN_OPERATION" && node.type !== "VECTOR" && node.type !== "STAR" && node.type !== "LINE" && node.type !== "ELLIPSE" && node.type !== "RECTANGLE" && node.type !== "POLYGON" && node.type !== "TEXT" && node.type !== "FRAME" && node.type !== "COMPONENT_SET" && node.type !== "STICKY" && node.type !== "WIDGET" && node.type !== "CONNECTOR" && node.type !== "CODE_BLOCK" && node.type !== "SHAPE_WITH_TEXT" && node.type !== "STAMP" && node.type !== "EMBED" && node.type !== "LINK_UNFURL" && node.type !== "MEDIA" && node.type !== "TABLE") {
//       try {
//         if (node.fillStyleId === styleId) {
//           node.fillStyleId = styleCopy.id;
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     }
//   });
//   //remove the original style from the file
//   style.remove();
// });

//---------------------------------------------------------------------------------------------

// For each Figma node in the selection, if there is a fill style and/or a stroke style applied to the node, read the variable name of the fill style and/or stroke style, and then apply the local style that has the same name as the variable name to the node
// figma.currentPage.selection.forEach((node) => {
//   if (node.fillStyleId) {
//     let fillStyleId = node.fillStyleId;
//     let fillStyle = figma.getStyleById(fillStyleId);
//     let fillVariable = figma.variables.getLocalVariables().find((variable) => {
//       return variable.id === fillStyle.variableId;
//     });
//     if (fillVariable) {
//       let fillVariableId = fillVariable.id;
//       let fillStyle = figma.getLocalPaintStyles().find((style) => {
//         return style.variableId === fillVariableId;
//       });
//       if (fillStyle) {
//         node.fillStyleId = fillStyle.id;
//       }
//     }
//   }
//   if (node.strokeStyleId) {
//     let strokeStyleId = node.strokeStyleId;
//     let strokeStyle = figma.getStyleById(strokeStyleId);
//     let strokeVariable = figma.variables.getLocalVariables().find((variable) => {
//       return variable.id === strokeStyle.variableId;
//     });
//     if (strokeVariable) {
//       let strokeVariableId = strokeVariable.id;
//       let strokeStyle = figma.getLocalPaintStyles().find((style) => {
//         return style.variableId === strokeVariableId;
//       });
//       if (strokeStyle) {
//         node.strokeStyleId = strokeStyle.id;
//       }
//     }
//   }
// });

//---------------------------------------------------------------------------------------------

// this script binds local variables to the fill and stroke styles of each selected node in the current page based on the style names.
// Iterate over each selected node in the current page
figma.currentPage.selection.forEach(async (node) => {
  // Fetch the local variables
  const localVariables = await figma.variables.getLocalVariablesAsync();
  console.log("localVariables", localVariables);

  // Check if the node has a fill style
  if (node.fillStyleId) {
    // Get the ID of the fill style
    let fillStyleId = node.fillStyleId;
    // Fetch the fill style
    let fillStyle = await figma.getStyleByIdAsync(fillStyleId);
    // Get the name of the fill style, remove all spaces, and convert it to lowercase
    let fillStyleName = fillStyle.name.replace(/\s/g, "").toLowerCase();
    console.log("fillStyleName", fillStyleName);
    // Remove the prefix before the first slash in the fill style name to get the fill variable name
    let fillVariableName = fillStyleName.replace(/^[^\/]*\//, "");
    console.log("fillVariableName", fillVariableName);
    // Search for a local variable that has the same name as the fill variable name
    let fillVariable = localVariables.find((variable) => {
      return (
        variable.name.replace(/\s/g, "").toLowerCase() === fillVariableName
      );
    });
    console.log("fillVariable", fillVariable);
    // If such a variable is found
    if (fillVariable) {
      console.log("fillVariable match!", fillVariable);
      // Create a copy of the node's fills
      let fillsCopy = JSON.parse(JSON.stringify(node.fills));
      // Bind the found variable to the first fill in the copy
      fillsCopy[0] = figma.variables.setBoundVariableForPaint(
        fillsCopy[0],
        "color",
        fillVariable.id
      );
      // Set the node's fills to the modified copy
      node.fills = fillsCopy;
    }
  }

  // Check if the node has a stroke style
  if (node.strokeStyleId) {
    // Get the ID of the stroke style
    let strokeStyleId = node.strokeStyleId;
    // Fetch the stroke style
    let strokeStyle = await figma.getStyleByIdAsync(strokeStyleId);
    // Get the name of the stroke style, remove all spaces, and convert it to lowercase
    let strokeStyleName = strokeStyle.name.replace(/\s/g, "").toLowerCase();
    console.log("strokeStyleName", strokeStyleName);
    // Remove the prefix before the first slash in the stroke style name to get the stroke variable name
    let strokeVariableName = strokeStyleName.replace(/^[^\/]*\//, "");
    console.log("strokeVariableName", strokeVariableName);
    // Search for a local variable that has the same name as the stroke variable name
    let strokeVariable = localVariables.find((variable) => {
      return (
        variable.name.replace(/\s/g, "").toLowerCase() === strokeVariableName
      );
    });
    console.log("strokeVariable", strokeVariable);
    // If such a variable is found
    if (strokeVariable) {
      console.log("strokeVariable match!", strokeVariable);
      // Create a copy of the node's strokes
      let strokesCopy = JSON.parse(JSON.stringify(node.strokes));
      // Bind the found variable to the first stroke in the copy
      strokesCopy[0] = figma.variables.setBoundVariableForPaint(
        strokesCopy[0],
        "color",
        strokeVariable.id
      );
      // Set the node's strokes to the modified copy
      node.strokes = strokesCopy;
    }
  }
});
//---------------------------------------------------------------------------------------------

// a function that removes any lines of text in the content of a Text node that DOES NOT contain the prefix "--cib-color-" so that all is left in the text node is "--cib-color-" lines
figma.currentPage.selection.forEach(async (node) => {
  if (node.type === "TEXT") {
    // Load the font for the text node before manipulating it
    await figma.loadFontAsync(node.fontName);

    let text = node.characters;
    let newText = text
      .split("\n")
      .filter((line) => {
        return line.includes("--cib-color-");
      })
      .join("\n");
    node.characters = newText;
  }
});

//---------------------------------------------------------------------------------------------

figma.currentPage.selection.forEach(async (node) => {
  if (node.type === "TEXT") {
    // Load the font for the text node before manipulating it
    await figma.loadFontAsync(node.fontName);

    let text = node.characters;
    let textLines = text.split("\n");
    let textNodes = {};

    textLines.forEach((line) => {
      let lineParts = line.split(":");
      let lineKey = lineParts[0].replace("--cib-color-", "").split("-")[0];
      let lineValue = lineParts[1];
      if (textNodes[lineKey]) {
        textNodes[lineKey] += "\n" + line;
      } else {
        textNodes[lineKey] = line;
      }
    });

    for (const [key, value] of Object.entries(textNodes)) {
      let textNode = figma.createText();
      // Load the font for the new text node before setting its characters
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      textNode.characters = value;
      textNode.name = key;
      textNode.x = node.x;
      textNode.y = node.y;
      textNode.resize(node.width, node.height);
      textNode.fontName = { family: "Inter", style: "Regular" };
      textNode.textAlignHorizontal = "LEFT";
      textNode.textAlignVertical = "TOP";
      textNode.paragraphSpacing = node.paragraphSpacing;
      textNode.paragraphIndent = node.paragraphIndent;
      textNode.lineHeight = node.lineHeight;
      textNode.letterSpacing = node.letterSpacing;
      textNode.textCase = node.textCase;
      textNode.textDecoration = node.textDecoration;
      textNode.textAutoResize = node.textAutoResize;
      // Use setTextStyleIdAsync instead of textStyleId
      await textNode.setTextStyleIdAsync(node.textStyleId);
      textNode.textAlignVertical = node.textAlignVertical;
      textNode.textAlignHorizontal = node.textAlignHorizontal;
      textNode.textAutoResize = node.textAutoResize;
      textNode.textCase = node.textCase;
      textNode.textDecoration = node.textDecoration;

      // Add the new text node to the page
      figma.currentPage.appendChild(textNode);
    }
    // Remove the original text node from the page
    node.remove();
  }
});

//---------------------------------------------------------------------------------------------

// for each node with a selected paint variable for its fill (NOT a fillStyle, but a variable), rename the fill variable by replacing the "Background" prefix with "Fill" (e.g. "Background/Neutral/Secondary" would be renamed to "Fill/Neutral/Secondary")
// figma.currentPage.selection.forEach((node) => {
//   if (node.boundVariables && node.boundVariables.fills) {
//     node.boundVariables.fills.forEach((fill) => {
//       const variable = figma.variables.getVariableById(fill.id);
//       if (variable) {
//         const newVariableName = variable.name.replace("Background", "Fill");
//         figma.variables.renameVariable(variable.id, newVariableName);
//       }
//     });
//   }
// });

//---------------------------------------------------------------------------------------------

// for each selected node with a fill style, use the local fillStyle instead based on the node's original fillStyle name but without the "Light Mode/" prefix. So, for example, a node with a fillStyle name of "Light Mode/Background/Neutral/Secondary" would use the local fillStyle with the name "Background/Neutral/Secondary"
figma.currentPage.selection.forEach((node) => {
  if (node.fillStyleId) {
    let fillStyleId = node.fillStyleId;
    let fillStyle = figma.getStyleById(fillStyleId);
    let fillStyleName = fillStyle.name;
    let newFillStyleName = fillStyleName.replace("Light Mode/", "");
    let newFillStyle = figma.getLocalPaintStyles().find((style) => {
      return style.name === newFillStyleName;
    });
    if (newFillStyle) {
      node.fillStyleId = newFillStyle.id;
    }
  }
});

//---------------------------------------------------------------------------------------------

// function that creates Figma hierarchical structure of nested nodes based on the hierarchical structure of an HTML element based on this set of rules: for a `<div>` html element, create a Frame node with autolayout properties set on the Frame: set `layoutMode` to "HORIZONTAL" by default, and set `layoutWrap` to "WRAP" by default, and set both `layoutSizingHorizontal` and `layoutSizingVertical` to "HUG" by default, and use the padding values of the HTML element to set the corresponding `paddingBottom` `paddingLeft` and `paddingRight` and `paddingTop` properties of the auto layout in Figma; for any inner text, create a Text node; for any inner `<div>` html element, create a Frame node inside the parent Frame node; for any inner html text, create a text node; for any `<span>` html element, use Text range functions that allow you to get and set text properties on parts of the text node like `setRangeFontSize`, `setRangeFontName`, `setRangeTextDecoration`, `setRangeTextCase`, `setRangeLetterSpacing`, `setRangeLineHeight`, `setRangeFills`, `setRangeTextAlignHorizontal`, `setRangeTextAlignVertical`, `setRangeTextAutoResize`, `setRangeHyperlink`
function createFigmaNodesFromHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  async function createNodesFromHtmlElement(element) {
    let node;
    if (element.nodeType === Node.ELEMENT_NODE) {
      if (element.tagName === "DIV") {
        node = figma.createFrame();
        node.layoutMode = "HORIZONTAL";
        node.layoutWrap = "WRAP";
        node.layoutSizingHorizontal = "HUG";
        node.layoutSizingVertical = "HUG";
        node.paddingBottom = parseFloat(
          getComputedStyle(element).paddingBottom
        );
        node.paddingLeft = parseFloat(getComputedStyle(element).paddingLeft);
        node.paddingRight = parseFloat(getComputedStyle(element).paddingRight);
        node.paddingTop = parseFloat(getComputedStyle(element).paddingTop);
      } else if (element.tagName === "IMG") {
        node = figma.createFrame();
        const src = element.getAttribute("src");
        let imageData;
        if (src.startsWith("data:image")) {
          const base64Data = src.split(",")[1];
          imageData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        } else {
          const response = await fetch(src);
          const blob = await response.blob();
          imageData = new Uint8Array(await blob.arrayBuffer());
        }
        node.fills = [
          {
            type: "IMAGE",
            scaleMode: "FILL",
            imageHash: figma.createImage(imageData).hash,
          },
        ];
      } else if (element.tagName === "SPAN") {
        node = figma.createText();
        // set text range properties here
      } else {
        return;
      }
      const childNodes = Array.from(element.childNodes);
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = await createNodesFromHtmlElement(childNodes[i]);
        if (childNode) {
          node.appendChild(childNode);
        }
      }
    } else if (element.nodeType === Node.TEXT_NODE) {
      node = figma.createText();
      node.characters = element.textContent;
    }
    return node;
  }

  createNodesFromHtmlElement(body).then((frame) => {
    if (frame) {
      figma.currentPage.appendChild(frame);
      console.log("Frame created from HTML:", frame);
    }
  });
}

//---------------------------------------------------------------------------------------------
/**
 * Checks if two colors are close enough based on a given tolerance.
 * @param {object} color1 - The first color.
 * @param {object} color2 - The second color.
 * @param {number} [tolerance=0.01] - The tolerance for the color difference.
 * @returns {boolean} - Returns true if the colors are close enough, otherwise false.
 */
function areColorsCloseEnough(color1, color2, tolerance = 0.01) {
  // Check if both colors are objects
  if (typeof color1 !== "object" || typeof color2 !== "object") {
    return false;
  }

  // Check if both colors are exactly the same
  if (
    color1.r === color2.r &&
    color1.g === color2.g &&
    color1.b === color2.b &&
    color1.a === color2.a
  ) {
    return true;
  }

  // Check if the RGB components of both colors are close enough
  const rgbCloseEnough =
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance;

  // Check if the alpha component exists in both colors
  const aExistsInBoth = "a" in color1 && "a" in color2;
  // Check if the alpha components of both colors are close enough
  const aCloseEnough = aExistsInBoth
    ? Math.abs(color1.a - color2.a) <= tolerance
    : true;

  // If the alpha component exists in both colors, return true if both the RGB and alpha components are close enough
  // If the alpha component doesn't exist in both colors, return true if the RGB components are close enough
  return aExistsInBoth ? rgbCloseEnough && aCloseEnough : rgbCloseEnough;
}

/**
 * Applies color variables to a node in a Figma design file.
 * @param {object} node - The node to apply the color variables to.
 * @param {string} modeId - The ID of the color mode.
 */
async function applyVariablesToNode(node, modeId) {
  // Get the local variables from Figma and reverse them
  const localVariables = (
    await figma.variables.getLocalVariablesAsync()
  ).reverse();

  // Check if the node has fills and if it's a frame
  if (node.fills && Array.isArray(node.fills) && node.type === "FRAME") {
    // Create a copy of the node's fills
    const fillsCopy = [...node.fills];
    // Iterate over each fill
    for (let index = 0; index < fillsCopy.length; index++) {
      const fill = fillsCopy[index];
      // Check if the fill is a solid color
      if (fill.type === "SOLID" && fill.color) {
        const fillColor = fill.color;
        // Find the matching variables based on the fill color
        const matchingVariables = localVariables.filter((variable) => {
          const value = variable.valuesByMode[modeId];
          const isFillOrBackgroundVariable =
            variable.name.startsWith("Fill") ||
            variable.name.startsWith("Background");
          const isColorMatch = value && areColorsCloseEnough(value, fillColor);
          return isColorMatch && isFillOrBackgroundVariable;
        });
        // If there are matching variables, apply the closest matching variable to the fill
        if (matchingVariables.length > 0) {
          let matchingVariable;
          const perfectMatch = matchingVariables.find(
            (variable) =>
              "a" in variable.valuesByMode[modeId] &&
              variable.valuesByMode[modeId].a === 1
          );
          if (perfectMatch) {
            matchingVariable = perfectMatch;
          } else if (
            "a" in fillColor &&
            matchingVariables.some(
              (variable) => "a" in variable.valuesByMode[modeId]
            )
          ) {
            matchingVariable = matchingVariables.reduce(
              (closestVariable, currentVariable) => {
                const closestADifference = Math.abs(
                  1 - closestVariable.valuesByMode[modeId].a
                );
                const currentADifference = Math.abs(
                  1 - currentVariable.valuesByMode[modeId].a
                );
                return currentADifference < closestADifference
                  ? currentVariable
                  : closestVariable;
              }
            );
          } else {
            matchingVariable = matchingVariables[0];
          }
          fillsCopy[index] = figma.variables.setBoundVariableForPaint(
            fillsCopy[index],
            "color",
            matchingVariable
          );
        }
      }
    }
    // Set the node's fills to the modified copy
    node.fills = fillsCopy;
  }

  // Check if the node has strokes
  if (node.strokes && Array.isArray(node.strokes)) {
    // Create a copy of the node's strokes
    const strokesCopy = [...node.strokes];
    // Iterate over each stroke
    for (let index = 0; index < strokesCopy.length; index++) {
      const stroke = strokesCopy[index];
      // Check if the stroke is a solid color
      if (stroke.type === "SOLID" && stroke.color) {
        const strokeColor = stroke.color;
        // Find the matching variable based on the stroke color
        const matchingVariable = localVariables.find((variable) => {
          const value = variable.valuesByMode[modeId];
          const isStrokeVariable = variable.name.startsWith("Stroke");
          return (
            isStrokeVariable &&
            value &&
            areColorsCloseEnough(value, strokeColor)
          );
        });
        // If a matching variable is found, apply it to the stroke
        if (matchingVariable) {
          strokesCopy[index] = figma.variables.setBoundVariableForPaint(
            strokesCopy[index],
            "color",
            matchingVariable
          );
        }
      }
    }
    // Set the node's strokes to the modified copy
    node.strokes = strokesCopy;
  }

  // If the node has children, apply the variables to each child node recursively
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      await applyVariablesToNode(child, modeId);
    }
  }
}

/**
 * The main function that applies color variables to selected nodes in Figma based on a specified color mode.
 */
async function main() {
  // Define the name of the color mode
  const modeName = "Light Mode";

  // Get the local variable collections from Figma
  const modeCollection =
    await figma.variables.getLocalVariableCollectionsAsync();

  // Find the ID of the color mode with the specified name
  const modeId = modeCollection[0].modes.find(
    (mode) => mode.name === modeName
  ).modeId;

  // Iterate over each selected node on the current page
  for (const node of figma.currentPage.selection) {
    // Apply the color variables to the node based on the specified color mode
    await applyVariablesToNode(node, modeId);
  }
}

// Call the main function
main();

//---------------------------------------------------------------------------------------------

function calculateOpaqueColor(color, opacity) {
  // Convert color to RGB format
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  // Check if color is white or black and opacity is less than 100%
  if (
    opacity < 1 &&
    ((r === 255 && g === 255 && b === 255) || (r === 0 && g === 0 && b === 0))
  ) {
    // Calculate new color by overlaying semi-transparent color over fully opaque color
    const newR =
      r === 255
        ? Math.round(255 - (255 - 0) * (1 - opacity))
        : Math.round(0 + (255 - 0) * (1 - opacity));
    const newG =
      g === 255
        ? Math.round(255 - (255 - 0) * (1 - opacity))
        : Math.round(0 + (255 - 0) * (1 - opacity));
    const newB =
      b === 255
        ? Math.round(255 - (255 - 0) * (1 - opacity))
        : Math.round(0 + (255 - 0) * (1 - opacity));

    // Replace original color with new calculated opaque color
    return { r: newR / 255, g: newG / 255, b: newB / 255 };
  }

  // Return original color if it's not white or black or if opacity is 100%
  return color;
}

function flattenColors(nodes) {
  for (const node of nodes) {
    if ("fills" in node) {
      const newFills = clone(node.fills);
      for (let i = 0; i < newFills.length; i++) {
        if (newFills[i].type === "SOLID") {
          newFills[i].color = calculateOpaqueColor(
            newFills[i].color,
            newFills[i].opacity
          );
          newFills[i].opacity = 1;
        }
      }
      node.fills = newFills;
    }

    if ("strokes" in node) {
      const newStrokes = clone(node.strokes);
      for (let i = 0; i < newStrokes.length; i++) {
        if (newStrokes[i].type === "SOLID") {
          newStrokes[i].color = calculateOpaqueColor(
            newStrokes[i].color,
            newStrokes[i].opacity
          );
          newStrokes[i].opacity = 1;
        }
      }
      node.strokes = newStrokes;
    }

    if ("children" in node) {
      flattenColors(node.children);
    }
  }
}

flattenColors(figma.currentPage.selection);

//---------------------------------------------------------------------------------------------

// for each selected node, color sample the pixel on the Figma canvas at the center x and y position of the node and set the fill color of the node to the color of the pixel
function processNode(node) {
  const x = node.x + node.width / 2;
  const y = node.y + node.height / 2;
  const color = figma
    .getImageByHash(figma.createImage(new Uint8Array([0, 0, 0, 0]), 1, 1).hash)
    .getPixelColor(x, y);
  if (node.fills && Array.isArray(node.fills)) {
    node.fills = [
      {
        type: "SOLID",
        color: { r: color.r / 255, g: color.g / 255, b: color.b / 255 },
      },
    ];
  }

  // If the node has children, process each child
  if (node.children && node.children.length > 0) {
    node.children.forEach(processNode);
  }
}

// Process each selected node
figma.currentPage.selection.forEach(processNode);

//---------------------------------------------------------------------------------------------

// given this text "Review key points in file" I want to split the text by the last word "file". What is the regular expression to do so?
const text = "Review key points in file";
const regex = /(.*)\s(.*)/;
const match = text.match(regex);
const firstPart = match[1];
const secondPart = match[2];
console.log("firstPart", firstPart);
console.log("secondPart", secondPart);

//---------------------------------------------------------------------------------------------

function clone(val) {
  const type = typeof val;
  if (val === null) {
    return null;
  } else if (
    type === "undefined" ||
    type === "number" ||
    type === "string" ||
    type === "boolean"
  ) {
    return val;
  } else if (type === "object") {
    if (val instanceof Array) {
      return val.map((x) => clone(x));
    } else if (val instanceof Uint8Array) {
      return new Uint8Array(val);
    } else {
      let o = {};
      for (const key in val) {
        o[key] = clone(val[key]);
      }
      return o;
    }
  }
  throw "unknown";
}

function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);
  const h1p = getHue(a1p, b1);
  const h2p = getHue(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  const dHp = getDhp(C1p, C2p, h1p, h2p);
  const avgLp = (L1 + L2) / 2;
  const avgCp = (C1p + C2p) / 2;
  const avghp = getAvghp(h1p, h2p);
  const T =
    1 -
    0.17 * Math.cos(toRad(avghp - 30)) +
    0.24 * Math.cos(toRad(2 * avghp)) +
    0.32 * Math.cos(toRad(3 * avghp + 6)) -
    0.2 * Math.cos(toRad(4 * avghp - 63));
  const dTheta = 30 * Math.exp(-(((avghp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
  const SL =
    1 + (0.015 * (avgLp - 50) ** 2) / Math.sqrt(20 + (avgLp - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const RT = -Math.sin(toRad(2 * dTheta)) * Rc;
  const dE = Math.sqrt(
    (dLp / SL) ** 2 +
      (dCp / SC) ** 2 +
      (dHp / SH) ** 2 +
      RT * (dCp / SC) * (dHp / SH)
  );
  return dE;
}

function getHue(a, b) {
  return a >= 0 && b === 0
    ? 0
    : a < 0 && b === 0
    ? 180
    : a === 0 && b > 0
    ? 90
    : a === 0 && b < 0
    ? 270
    : (Math.atan2(b, a) * 180) / Math.PI;
}

function getDhp(C1, C2, h1p, h2p) {
  if (C1 * C2 === 0) return 0;
  return h2p <= h1p ? h2p - h1p : h2p - h1p - 360;
}

function getAvghp(h1p, h2p) {
  if (Math.abs(h1p - h2p) > 180) return (h1p + h2p + 360) / 2;
  return (h1p + h2p) / 2;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function labToLch(lab) {
  const [L, a, b] = lab;
  const C = Math.sqrt(a ** 2 + b ** 2);
  const h = getHue(a, b);
  return [L, C, h];
}

function rgbToLab(r, g, b) {
  let x, y, z;
  (r /= 255), (g /= 255), (b /= 255);
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  y = (r * 0.21267 + g * 0.71516 + b * 0.07217) / 1.0;
  z = (r * 0.01933 + g * 0.11919 + b * 0.9505) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787037 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787037 * z + 16 / 116;
  let L = 116 * y - 16;
  let a = 500 * (x - y);
  let b2 = 200 * (y - z);
  return [L, a, b2];
}

async function replaceStyle(textNode, styles) {
  console.log("replaceStyle() - textNode", textNode);
  console.log("replaceStyle() - styles", styles);
  let bestStyle = textNode.textStyleId;
  let smallestDifference = Infinity;
  let fontName = textNode.fontName;
  console.log("fontName", fontName);

  // filter styles by fontName.family and fontName.style
  styles = styles.filter(
    (style) =>
      style.fontName.family === fontName.family &&
      style.fontName.style === fontName.style
  );
  console.log("(reduced) styles", styles);

  for (const style of styles) {
    console.log("style.fontSize", style.fontSize);
    console.log("style.lineHeight.value", style.lineHeight.value);
    // console.log("style.fontWeight", style.fontWeight);
    console.log("textNode.fontSize", textNode.fontSize);
    console.log("textNode.lineHeight.value", textNode.lineHeight.value);
    // console.log("textNode.fontWeight", textNode.fontWeight);

    const fontSizeDifference = Math.abs(
      parseFloat(style.fontSize) - parseFloat(textNode.fontSize)
    );
    const lineHeightDifference = Math.abs(
      parseFloat(style.lineHeight.value) - parseFloat(textNode.lineHeight.value)
    );

    // Multiply the font size difference by a large number to give it more weight
    const difference = fontSizeDifference * 1000 + lineHeightDifference;

    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestStyle = style.id;
      console.log("style.id", style.id);
      console.log("bestStyle", bestStyle);
    }
  }
  // load the font before setting the text style
  await figma.loadFontAsync(fontName);
  await textNode.setTextStyleIdAsync(bestStyle);
}

async function findClosestColor(
  node,
  colorVariableIds,
  modeId,
  isStroke = false
) {
  let closestColorVariable = null;
  let closestColorDistance = Infinity;
  for (let colorVariableId of colorVariableIds) {
    const colorVariable = await figma.variables.getVariableByIdAsync(
      colorVariableId
    );
    if (colorVariable.valuesByMode && colorVariable.valuesByMode[modeId]) {
      // If the node is a TEXT node, only consider variables that start with "Foreground/"
      // If the paint applies to the stroke, only consider variables that start with "Stroke/"
      if (
        (node.type === "TEXT" &&
          !colorVariable.name.startsWith("Foreground/")) ||
        (isStroke && !colorVariable.name.startsWith("Stroke/"))
      ) {
        continue;
      }

      const colorValue = colorVariable.valuesByMode[modeId];
      const nodeColor = isStroke ? node.strokes[0].color : node.fills[0].color;
      const nodeOpacity = isStroke
        ? node.strokes[0].opacity
        : node.fills[0].opacity;

      // console.warn("isStroke", isStroke);
      // console.log("nodeColor", nodeColor);
      // console.log("nodeOpacity", nodeOpacity);
      // console.log("colorValue", colorValue);
      // console.log("colorValue.a", colorValue.a);
      // console.log("nodeOpacity !== colorValue.a", nodeOpacity !== colorValue.a);

      // Check if the opacities of the node color and the color variable are equal
      if (nodeOpacity !== colorValue.a) {
        continue;
      }

      const lab1 = rgbToLab(
        nodeColor.r * 255,
        nodeColor.g * 255,
        nodeColor.b * 255
      );
      const lab2 = rgbToLab(
        colorValue.r * 255,
        colorValue.g * 255,
        colorValue.b * 255
      );
      const colorDistance = deltaE2000(lab1, lab2);

      if (colorDistance < closestColorDistance) {
        closestColorDistance = colorDistance;
        closestColorVariable = colorVariable;
      }
    }
  }

  return closestColorVariable;
}

async function applyClosestColorVariable(
  node,
  colorVariableIds,
  modeId,
  styles,
  ignorePrefix = false
) {
  if (node.fills && node.fills.length && node.fills[0].color) {
    const closestColorVariable = await findClosestColor(
      node,
      colorVariableIds,
      modeId
    );

    if (closestColorVariable) {
      // Clone the fills array
      const fillsCopy = clone(node.fills);

      // Set the closest color variable to the first fill of the node
      fillsCopy[0] = figma.variables.setBoundVariableForPaint(
        fillsCopy[0],
        "color",
        closestColorVariable
      );

      // Apply the modified fills array back to the node
      node.fills = fillsCopy;
    }
  }

  if (node.strokes && node.strokes.length && node.strokes[0].color) {
    const isStroke = ignorePrefix ? false : true;
    console.log("ignorePrefix / isStroke", ignorePrefix, isStroke);
    const closestColorVariable = await findClosestColor(
      node,
      colorVariableIds,
      modeId,
      isStroke
    );

    if (closestColorVariable) {
      // Clone the strokes array
      const strokesCopy = clone(node.strokes);

      // Set the closest color variable to the first stroke of the node
      strokesCopy[0] = figma.variables.setBoundVariableForPaint(
        strokesCopy[0],
        "color",
        closestColorVariable
      );

      // Apply the modified strokes array back to the node
      node.strokes = strokesCopy;
    }
  }

  // If the node is a text node, replace the style
  if (node.type === "TEXT") {
    console.log("node.type", node.type);
    console.log("node", node);
    console.log("styles", styles);
    replaceStyle(node, styles);
  }

  // Apply to the children of the node
  if (node.children) {
    for (let child of node.children) {
      await applyClosestColorVariable(child, colorVariableIds, modeId, styles);
    }
  }
}

// Define the mode name
const modeName = "Dark Mode";

// Get all local variable collections
const variableCollections =
  await figma.variables.getLocalVariableCollectionsAsync();

// Find the collection that contains the mode named "Light Mode"
const lightModeCollection = variableCollections.find((collection) =>
  collection.modes.some((mode) => mode.name === modeName)
);

// If the collection exists and has a variables property, get the color variables for the "Light Mode"
let colorVariableIds = [];
let modeId;
if (lightModeCollection && lightModeCollection.variableIds) {
  modeId = lightModeCollection.modes.find(
    (mode) => mode.name === modeName
  ).modeId;

  colorVariableIds = lightModeCollection.variableIds.filter(
    (variableId) =>
      figma.variables.getVariableById(variableId).valuesByMode[modeId]
  );
}
console.log("colorVariableIds", colorVariableIds);

// a loop that for each selected node, applies the closest color variable to the node and its descendants
for (let node of figma.currentPage.selection) {
  const styles = figma.getLocalTextStyles();
  await applyClosestColorVariable(node, colorVariableIds, modeId, styles, true);
}

//---------------------------------------------------------------------------------------------

async function splitTextNodes(nodes, delimiter = " ") {
  for (const node of nodes) {
    if (node.type === "TEXT") {
      // Load the font used by the text node
      await figma.loadFontAsync(node.fontName);

      // Split the text node's characters by the delimiter
      const parts = node.characters.split(delimiter);

      // Create an auto layout frame
      const frame = figma.createFrame();
      frame.layoutMode = "HORIZONTAL";
      frame.counterAxisSizingMode = "AUTO";
      frame.primaryAxisAlignItems = "CENTER";
      frame.itemSpacing = 10; // adjust as needed

      // For each part, create a new text node and append it to the frame
      for (const part of parts) {
        const newNode = figma.createText();
        newNode.fontName = node.fontName;
        newNode.characters = part;
        frame.appendChild(newNode);
      }

      // Replace the original node with the frame in its parent's children array
      const index = node.parent.children.indexOf(node);
      node.parent.insertChild(index, frame);

      // Remove the original node
      node.remove();
    }
  }
}

// Usage: Assuming `selectedNodes` is an array of the currently selected nodes
splitTextNodes(figma.currentPage.selection);

// Usage with an optional delimeter
// splitTextNodes(figma.currentPage.selection, ',');

//---------------------------------------------------------------------------------------------

// For each selected node and its children (recursively), match the fill or stroke variable name that is on the node to a local variable name and apply the local variable to the respective fill or stroke of the node
const localVariables = await figma.variables.getLocalVariablesAsync();
figma.currentPage.selection.forEach(async (node) => {
  if (
    node.boundVariables &&
    node.boundVariables.fills &&
    node.boundVariables.fills[0]
  ) {
    let matchingVariable = localVariables.find(
      (theVariable) => theVariable.id === node.boundVariables.fills[0].id
    );
    // Apply the local variable to the node
    if (matchingVariable) {
      await applyLocalVariableToNode(node, matchingVariable);
    }
  }
});

//---------------------------------------------------------------------------------------------

// a Figma plugin script that selects each component set, creates a new frame with the specified auto-layout properties, and sorts the components by their naming conventions and numerical values in their names. This script ensures components with 'Regular' in their names precede those with 'Filled', and sorts components with numbers in their names in ascending order.

const selection = figma.currentPage.selection;

selection.forEach((node) => {
  if (node.type === "COMPONENT_SET" && node.children.length > 0) {
    // Create a new auto-layout frame
    const frame = figma.createFrame();
    frame.name = node.name; // Name frame after the component set
    frame.layoutMode = "VERTICAL";
    frame.paddingTop =
      frame.paddingBottom =
      frame.paddingLeft =
      frame.paddingRight =
        16;
    frame.itemSpacing = 16;
    frame.counterAxisSizingMode = "AUTO"; // Hug contents
    frame.primaryAxisSizingMode = "AUTO"; // Hug contents
    frame.x = node.x + node.width + 100; // Position to the right of the component set for visibility
    frame.y = node.y;

    // Extract components
    const components = node
      .findAll((n) => n.type === "COMPONENT")
      .map((component) => ({
        id: component.id,
        name: component.name.toLowerCase(),
        number: Number((component.name.match(/\d+/) || [0])[0]),
        isRegular: component.name.toLowerCase().includes("regular"),
        isFilled: component.name.toLowerCase().includes("filled"),
        component,
      }));

    // Sort components by criteria
    const sortedComponents = components.slice().sort((a, b) => {
      if (a.isRegular && !b.isRegular) return -1;
      if (!a.isRegular && b.isRegular) return 1;
      if (!a.isFilled && b.isFilled) return -1;
      if (a.isFilled && !b.isFilled) return 1;
      return a.number - b.number;
    });

    // Move and re-append components in sorted order
    sortedComponents.forEach(({ component }) => {
      const clonedComponent = component.clone(); // Clone to avoid direct manipulation issues
      frame.appendChild(clonedComponent);
      component.remove(); // Remove the original component
    });

    // Set auto layout properties for the new frame
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisAlignItems = "CENTER";
    frame.counterAxisAlignItems = "CENTER";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.itemSpacing = 10;

    figma.currentPage.appendChild(frame); // Ensure the new frame is added to the page
  }
});

figma.notify("Components sorted and moved into new auto-layout frames.");

//---------------------------------------------------------------------------------------------

// rename each selected frame by the number of children it has
figma.currentPage.selection.forEach((node) => {
  if (node.type === "FRAME") {
    node.name = `${node.children.length} children`;
  }
});

//---------------------------------------------------------------------------------------------

// write a console script for Figma, in which for the `VariableCollection` with `name` of "Color" in the local variables collections array that is accessed via `figma.variables.getLocalVariableCollectionsAsync()`, create a text node for each variable in `variableIds`. Set the `characters` of each text node to the variable's name. Group all text nodes into the same auto layout frame node set to vertical layout
figma.variables.getLocalVariableCollectionsAsync().then((collections) => {
  const colorCollection = collections.find(
    (collection) => collection.name === "Color"
  );
  if (colorCollection) {
    const colorVariableIds = colorCollection.variableIds;
    const textNodesPromises = colorVariableIds.map(async (variableId) => {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      const textNode = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      textNode.characters = variable.name;
      return textNode;
    });
    Promise.all(textNodesPromises).then((textNodes) => {
      const frame = figma.createFrame();
      frame.layoutMode = "VERTICAL";
      frame.counterAxisSizingMode = "AUTO";
      frame.primaryAxisAlignItems = "MIN";
      frame.itemSpacing = 16;
      textNodes.forEach((textNode) => {
        frame.appendChild(textNode);
      });
      figma.currentPage.appendChild(frame);
    });
  }
});

//---------------------------------------------------------------------------------------------

// Define the calculateComposite function
function calculateComposite(foreground, background, opacity) {
  const alpha = opacity + background.a * (1 - opacity);
  const red =
    (foreground.r * opacity + background.r * background.a * (1 - opacity)) /
    alpha;
  const green =
    (foreground.g * opacity + background.g * background.a * (1 - opacity)) /
    alpha;
  const blue =
    (foreground.b * opacity + background.b * background.a * (1 - opacity)) /
    alpha;
  return { r: red, g: green, b: blue, a: alpha };
}

// Get the selected node
const selectedNode = figma.currentPage.selection[0];

if (selectedNode && selectedNode.parent) {
  // Get the fill color of the selected node and its parent node
  const foregroundColor = selectedNode.fills[0].color;
  const backgroundColor =
    selectedNode.parent.type === "PAGE"
      ? selectedNode.parent.backgrounds[0].color
      : selectedNode.parent.fills[0].color;

  // Convert the colors to the format expected by the calculateComposite function
  const foreground = {
    r: foregroundColor.r,
    g: foregroundColor.g,
    b: foregroundColor.b,
    a: selectedNode.opacity,
  };
  const background = {
    r: backgroundColor.r,
    g: backgroundColor.g,
    b: backgroundColor.b,
    a: selectedNode.parent.type === "PAGE" ? 1 : selectedNode.parent.opacity,
  };

  // Calculate the resulting composited color and alpha
  const newComposite = calculateComposite(foreground, background, foreground.a);
  console.log("newComposite", newComposite);

  // Apply the new foreground color to the selected node
  selectedNode.fills = [
    {
      type: "SOLID",
      color: { r: newComposite.r, g: newComposite.g, b: newComposite.b },
      opacity: newComposite.a,
    },
  ];
}

//---------------------------------------------------------------------------------------------

// For every selected node and its children, replace its corner radius value with a variable from the local variable collection named "Copilot Web Structure" matching the corner radius value of the node to the value of the variable
async function replaceCornerRadius() {
  const localVars = await figma.variables.getLocalVariablesAsync();
  const collections = await Promise.all(
    localVars.map((localVar) =>
      figma.variables.getVariableCollectionByIdAsync(
        localVar.variableCollectionId
      )
    )
  );
  const variableCollection = collections.find(
    (collection) => collection.name === "Copilot Web Structure"
  );
  figma.currentPage.selection.forEach((node) => {
    const cornerRadius = node.cornerRadius;
    const matchingVariable = variableCollection.variables.find(
      (variable) =>
        variable.valuesByMode[variableCollection.modes[0].modeId]
          .cornerRadius === cornerRadius
    );
    if (matchingVariable) {
      node.setBoundVariable("cornerRadius", matchingVariable);
    }
  });
}
replaceCornerRadius();

//---------------------------------------------------------------------------------------------

// Sample code reference: https://www.figma.com/plugin-docs/working-with-variables/ -

//---------------------------------------------------------------------------------------------

// For each selected node and its children, construct a token (or variable) name based on the parent name of the parent node(s) and each property. For example, if the parent node is named "Button" and the fill property is set to a value (e.g) "#000000"), the token name to construct and save in the array would be "Button-Background"; for stroke it would be "Button-Stroke". If the parent node has children, and the child node name is "Icon", and the fill property is set to a value (e.g) "#000000", the token name to construct and save in the array would be "Button-Icon-Background". The array of token names should be logged to the console.
const tokenNames = [];
figma.currentPage.selection.forEach((node) => {
  const getParentName = (node) => {
    if (node.parent.type === "PAGE") {
      return node.name;
    }
    return getParentName(node.parent);
  };
  const constructTokenName = (node, parentName) => {
    const tokenName = `${parentName}-${node.name}`;
    tokenNames.push(tokenName);
    if (node.children) {
      node.children.forEach((child) => {
        constructTokenName(child, tokenName);
      });
    }
  };
  const parentName = getParentName(node);
  constructTokenName(node, parentName);
});

//---------------------------------------------------------------------------------------------

function generateCSSDesignTokens(node) {
  // Helper function to format CSS property names
  const formatCSSName = (name) => name.toLowerCase().replace(/\s+/g, "-");

  // Helper function to safely convert values to strings
  const safeString = (value) => {
    try {
      return value.toString();
    } catch (e) {
      return "";
    }
  };

  // Start the CSS string
  let css = "";

  // Recursive function to process each node
  function processNode(node, suffix = "", parentPrefix = "") {
    // Node name as part of the CSS variable prefix
    const prefix = `${parentPrefix}${formatCSSName(node.name)}`;

    // Layout properties
    css += `--${prefix}-width${suffix}: ${safeString(node.width)}px;\n`;
    css += `--${prefix}-height${suffix}: ${safeString(node.height)}px;\n`;

    // Color and stroke
    if (node.fills && node.fills.length > 0 && node.fills[0].type === "SOLID") {
      const fill = node.fills[0];
      css += `--${prefix}-background-color${suffix}: rgba(${Math.round(
        fill.color.r * 255
      )}, ${Math.round(fill.color.g * 255)}, ${Math.round(
        fill.color.b * 255
      )}, ${safeString(
        fill.opacity === 0 || fill.opacity === 1
          ? fill.opacity.toFixed(0)
          : fill.opacity.toFixed(2)
      )});\n`;
    }
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      css += `--${prefix}-stroke-color${suffix}: rgba(${Math.round(
        stroke.color.r * 255
      )}, ${Math.round(stroke.color.g * 255)}, ${Math.round(
        stroke.color.b * 255
      )}, ${safeString(
        stroke.opacity === 0 || stroke.opacity === 1
          ? stroke.opacity.toFixed(0)
          : stroke.opacity.toFixed(2)
      )});\n`;
      css += `--${prefix}-stroke-width${suffix}: ${safeString(
        node.strokeWeight !== figma.mixed ? nodeStrokeWeight : ""
      )};\n`;
    }

    // Corner radius
    if (node.cornerRadius) {
      css += `--${prefix}-corner-radius${suffix}: ${safeString(
        node.cornerRadius
      )}px;\n`;
    }

    // Text properties
    if (node.type === "TEXT") {
      css += `--${prefix}-font-family${suffix}: '${safeString(
        node.fontName.family
      )}';\n`;
      css += `--${prefix}-font-weight${suffix}: '${safeString(
        node.fontName.style
      )}';\n`;
      css += `--${prefix}-font-size${suffix}: ${safeString(
        node.fontSize
      )}px;\n`;
      let lineHeightUnit =
        node.lineHeight.unit === "PIXELS" ? "px" : node.lineHeight.unit;
      let letterSpacingUnit =
        node.letterSpacing.unit === "PIXELS" ? "px" : node.letterSpacing.unit;
      css += `--${prefix}-line-height${suffix}: ${safeString(
        node.lineHeight.value
      )}${lineHeightUnit};\n`;
      css += `--${prefix}-letter-spacing${suffix}: ${safeString(
        node.letterSpacing.value
      )}${letterSpacingUnit};\n`;
    }

    // Effects like shadows
    if (node.effects && node.effects.length > 0) {
      node.effects.forEach((effect, index) => {
        if (effect.type === "DROP_SHADOW") {
          css += `--${prefix}-shadow-${index}${suffix}: ${safeString(
            effect.offset.x
          )}px ${safeString(effect.offset.y)}px ${safeString(
            effect.radius
          )}px rgba(${Math.round(effect.color.r * 255)}, ${Math.round(
            effect.color.g * 255
          )}, ${Math.round(effect.color.b * 255)}, ${safeString(
            effect.color.a === 0 || effect.color.a === 1
              ? effect.color.a.toFixed(0)
              : effect.color.a.toFixed(2)
          )});\n`;
        }
      });
    }

    // Recursively process children nodes
    if ("children" in node) {
      node.children.forEach((child) =>
        processNode(child, suffix, `${prefix}-`)
      );
    }
  }

  // Start processing from the root node
  const suffix =
    node.variantProperties && node.type === "INSTANCE"
      ? `-${node.variantProperties["State"].toLowerCase()}`
      : "";
  processNode(node, suffix);
  return css;
}

// Ensure a node is selected
if (figma.currentPage.selection.length > 0) {
  let css = "";
  figma.currentPage.selection.forEach((selectedNode) => {
    css += generateCSSDesignTokens(selectedNode);
  });
  // Output the CSS for reference
  console.log(css);
} else {
  console.log("Please select a node to generate design tokens.");
}

//---------------------------------------------------------------------------------------------

// In Figma, create a script that I can copy and paste into the browser console that will create an ellipse with arc data of a start of 0%, an end of 100%; and a ratio of 68%; and an angular fill gradient with 360 gradient stops with each hue of each gradient stop color being an iteration of 0-360 where a 0 degree hue is linearly interpolated to have a gradient stop position of 0% up to the last hue of 360 degrees being linearly interpolated to have a stop position of 100%. The color should use the OKLCH color space for the gradient stops. The ellipse should have a width of 200px and a height of 200px. The ellipse should be positioned at the center of the current viewport of the canvas.
const ellipse = figma.createEllipse();
ellipse.x = figma.viewport.center.x;
ellipse.y = figma.viewport.center.y;
ellipse.resize(200, 200);
ellipse.arcData = { startingAngle: 0, endingAngle: 100, innerRadius: 68 };
const stops = [];
for (let i = 0; i <= 360; i++) {
  stops.push({
    position: i / 360,
    color: { r: 1, g: 1, b: 1, a: 1 },
    type: "SOLID",
  });
}
ellipse.fills = [{ type: "GRADIENT_ANGULAR", gradientStops: stops }];
figma.currentPage.appendChild(ellipse);

//---------------------------------------------------------------------------------------------

// In Figma, create a script that I can copy and paste into the browser console that loops through each selected node and its children to log to the console any strokes on each node and nested child nodes
figma.currentPage.selection.forEach((node) => {
  function logStrokes(node) {
    if (node.strokes && node.strokes.length > 0) {
      console.log(node.name, node.strokes);
    }
    if (node.children) {
      node.children.forEach((child) => logStrokes(child));
    }
  }
  logStrokes(node);
});

//---------------------------------------------------------------------------------------------
async function generateComponentTokens() {
  // Helper function to convert layer properties to token names
  function createTokenName(
    layer,
    property,
    subProperty = "",
    variantProps = {}
  ) {
    let tokenName = layer.name.replace(/\s+/g, "-");
    for (let [key, value] of Object.entries(variantProps)) {
      if (value !== "default")
        tokenName += `-${key.toLowerCase()}-${value.toLowerCase()}`;
    }
    tokenName += `-${property}`;
    if (subProperty) tokenName += `-${subProperty}`;
    return tokenName;
  }

  // Fetch all selected nodes
  const selection = figma.currentPage.selection;
  if (!selection.length) {
    figma.notify("Please select at least one component.");
    return;
  }

  // Initialize the tokens object
  let tokens = {};

  // Process each selected node
  for (const node of selection) {
    if (node.type !== "COMPONENT" && node.type !== "INSTANCE") continue;

    // Gather variant properties
    const variantProps = node.type === "INSTANCE" ? node.variantProperties : {};

    // Check each layer for properties
    for (const layer of node.findAll()) {
      // Example properties to check (you can expand this as needed)
      const properties = ["fillStyleId", "strokeStyleId", "cornerRadius"];

      properties.forEach((property) => {
        if (layer[property] && layer[property] !== figma.mixed) {
          let subProperty = "";
          switch (property) {
            case "fillStyleId":
              property = "background";
              break;
            case "strokeStyleId":
              property = "stroke";
              break;
            case "cornerRadius":
              property = "corner";
              subProperty = "radius";
              break;
          }

          const tokenName = createTokenName(
            layer,
            property,
            subProperty,
            variantProps
          );
          tokens[tokenName] = layer[property];
        }
      });
    }
  }

  // Convert tokens object to JSON
  const tokensJSON = JSON.stringify(tokens, null, 2);

  // Log the tokens to the console
  console.log(tokensJSON);

  // Optionally, create a blob and download the tokens as a file
  const blob = new Blob([tokensJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tokens.json";
  link.click();
}

// Run the token generation function
generateComponentTokens();

//---------------------------------------------------------------------------------------------

function setTextColorBasedOnContrast(autoLayoutFrame) {
  // Extract the background color from the auto layout frame
  const bgColor = autoLayoutFrame.fills[0].color;

  // Calculate the relative luminance of the background color
  const bgLuminance = calculateRelativeLuminance(bgColor);

  // Define the relative luminance for pure black and pure white
  const blackLuminance = 0;
  const whiteLuminance = 1;

  // Calculate the contrast ratios for black-on-background and white-on-background
  const blackContrastRatio = calculateContrastRatio(
    bgLuminance,
    blackLuminance
  );
  const whiteContrastRatio = calculateContrastRatio(
    bgLuminance,
    whiteLuminance
  );

  // Determine the text color based on the higher contrast ratio
  const textColor =
    blackContrastRatio > whiteContrastRatio
      ? { r: 0, g: 0, b: 0 }
      : { r: 1, g: 1, b: 1 };

  // Set the text color for all text nodes in the auto layout frame
  for (const node of autoLayoutFrame.children) {
    if (node.type === "TEXT") {
      node.fills = [{ type: "SOLID", color: textColor }];
    }
  }
}

function calculateRelativeLuminance(color) {
  const rgb = [color.r, color.g, color.b];
  return rgb
    .map((c) => {
      if (c <= 0.03928) {
        return c / 12.92;
      } else {
        return Math.pow((c + 0.055) / 1.055, 2.4);
      }
    })
    .reduce((acc, c, i) => {
      const coefficient = i === 0 ? 0.2126 : i === 1 ? 0.7152 : 0.0722;
      return acc + coefficient * c;
    }, 0);
}

function calculateContrastRatio(luminance1, luminance2) {
  const darker = Math.min(luminance1, luminance2);
  const lighter = Math.max(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Load FONTS
async function loadFonts() {
  await Promise.all([
    figma.loadFontAsync({
      family: "Inter",
      style: "Regular",
    }),
    figma.loadFontAsync({
      family: "Segoe Sans",
      style: "Text Regular",
    }),
    figma.loadFontAsync({
      family: "Segoe Sans",
      style: "Text Semibold",
    }),
    figma.loadFontAsync({
      family: "Cascadia Code",
      style: "SemiLight",
    }),
  ]);
}

const textNode = figma.currentPage.selection[0];
let characters = textNode.characters;

characters = characters.replace(/.*?{/, "{");
characters = characters.replace(/'/g, '"');
characters = characters.replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:');
characters = characters.replace(/("\s*\n)/g, '",');
characters = characters.replace(/,(\s*})/g, "$1");
characters = characters.replace(/}\s*"/g, '}, "');

let colors = JSON.parse(characters);

const ignoreKeys = ["inherit", "current", "transparent", "black", "white"];
Object.keys(colors).forEach((key) => {
  if (ignoreKeys.includes(key)) {
    delete colors[key];
  }
});

const frame = figma.createFrame();
frame.layoutMode = "VERTICAL";
frame.counterAxisSizingMode = "AUTO";
frame.primaryAxisAlignItems = "MIN";
frame.itemSpacing = 48;
frame.cornerRadius = 32;
frame.paddingLeft = 88;
frame.paddingRight = 88;
frame.paddingTop = 88;
frame.paddingBottom = 88;

Object.entries(colors).forEach(async ([colorKey, colorValue]) => {
  const colorFrame = figma.createFrame();
  colorFrame.name = colorKey;
  colorFrame.layoutMode = "HORIZONTAL";
  colorFrame.counterAxisSizingMode = "AUTO";
  colorFrame.primaryAxisSizingMode = "FIXED";
  colorFrame.primaryAxisAlignItems = "MIN";
  colorFrame.layoutWrap = "WRAP";
  colorFrame.itemSpacing = 0;
  colorFrame.cornerRadius = 12;
  colorFrame.resize(1200, 340);
  frame.appendChild(colorFrame);

  if (typeof colorValue === "object") {
    Object.entries(colorValue).forEach(async ([subColorKey, subColor]) => {
      const autoLayoutFrame = figma.createFrame();
      autoLayoutFrame.layoutMode = "VERTICAL";
      autoLayoutFrame.name = subColorKey;
      autoLayoutFrame.fills = [
        {
          type: "SOLID",
          color: {
            r: parseInt(subColor.slice(1, 3), 16) / 255,
            g: parseInt(subColor.slice(3, 5), 16) / 255,
            b: parseInt(subColor.slice(5, 7), 16) / 255,
          },
        },
      ];
      autoLayoutFrame.cornerRadius = 0;
      autoLayoutFrame.cornerSmoothing = 0.6;
      autoLayoutFrame.counterAxisAlignItems = "MIN";
      autoLayoutFrame.primaryAxisAlignItems = "MAX";
      autoLayoutFrame.paddingLeft = 12;
      autoLayoutFrame.paddingRight = 12;
      autoLayoutFrame.paddingTop = 12;
      autoLayoutFrame.paddingBottom = 12;
      colorFrame.appendChild(autoLayoutFrame);

      let colorKeyTextNode = figma.createText();
      let subColorKeyTextNode = figma.createText();
      let hexColorTextNode = figma.createText();

      await loadFonts();

      // update the font name
      colorKeyTextNode.fontName = {
        family: "Segoe Sans",
        style: "Text Semibold",
      };
      subColorKeyTextNode.fontName = {
        family: "Segoe Sans",
        style: "Text Semibold",
      };
      hexColorTextNode.fontName = {
        family: "Cascadia Code",
        style: "SemiLight",
      };

      colorKeyTextNode.fontSize = 14;
      subColorKeyTextNode.fontSize = 14;
      hexColorTextNode.fontSize = 14;

      colorKeyTextNode.characters = colorKey;
      subColorKeyTextNode.characters = subColorKey;
      hexColorTextNode.characters = subColor;

      colorKeyTextNode.visible = false;
      autoLayoutFrame.appendChild(colorKeyTextNode);
      autoLayoutFrame.appendChild(subColorKeyTextNode);
      autoLayoutFrame.appendChild(hexColorTextNode);

      autoLayoutFrame.resize(240, 85);
      autoLayoutFrame.counterAxisSizingMode = "FIXED";
      autoLayoutFrame.counterAxisSizingMode = "FIXED";
      setTextColorBasedOnContrast(autoLayoutFrame);
    });
  } else {
    const autoLayoutFrame = figma.createFrame();
    autoLayoutFrame.layoutMode = "HORIZONTAL";
    autoLayoutFrame.layoutWrap = "WRAP";
    autoLayoutFrame.name = colorKey;
    autoLayoutFrame.fills = [
      {
        type: "SOLID",
        color: {
          r: parseInt(colorValue.slice(1, 3), 16) / 255,
          g: parseInt(colorValue.slice(3, 5), 16) / 255,
          b: parseInt(colorValue.slice(5, 7), 16) / 255,
        },
      },
    ];
    autoLayoutFrame.resize(240, 85);
    colorFrame.appendChild(autoLayoutFrame);

    let colorKeyTextNode = figma.createText();
    let hexColorTextNode = figma.createText();

    await loadFonts();

    // update the font name
    colorKeyTextNode.fontName = {
      family: "Segoe Sans",
      style: "Text Semibold",
    };
    hexColorTextNode.fontName = {
      family: "Cascadia Code",
      style: "SemiLight",
    };

    colorKeyTextNode.fontSize = 14;
    hexColorTextNode.fontSize = 14;

    // set the characters
    colorKeyTextNode.characters = colorKey;
    hexColorTextNode.characters = colorValue;

    autoLayoutFrame.appendChild(colorKeyTextNode);
    autoLayoutFrame.appendChild(hexColorTextNode);
    setTextColorBasedOnContrast(autoLayoutFrame);
  }
});

const viewportCenter = figma.viewport.center;
frame.x = viewportCenter.x - frame.width / 2;
frame.y = viewportCenter.y - frame.height / 2;
figma.currentPage.appendChild(frame);

figma.currentPage.selection = [frame];

//---------------------------------------------------------------------------------------------

// Get the frame that was created by the previous script
const frame = figma.currentPage.selection[0];

// Initialize an empty object to hold the colors
let colors1 = {};

// Iterate over the children of the frame (the color frames)
for (let colorFrame of frame.children) {
  // Get the name of the color frame
  let colorKey = colorFrame.name;

  // Initialize an empty object to hold the sub colors
  let subColors = {};

  // Iterate over the children of the color frame (the auto layout frames)
  for (let autoLayoutFrame of colorFrame.children) {
    // Get the name of the auto layout frame
    let subColorKey = autoLayoutFrame.name;

    // Get the fill color of the auto layout frame
    let fillColor = autoLayoutFrame.fills[0].color;

    // Convert the fill color to a hex color
    let subColor =
      "#" +
      [fillColor.r, fillColor.g, fillColor.b]
        .map((c) =>
          Math.round(c * 255)
            .toString(16)
            .padStart(2, "0")
        )
        .join("");

    // Add the sub color to the sub colors object
    subColors[subColorKey] = subColor;
  }

  // If the color frame has more than one child, add the sub colors object to the colors object
  // Otherwise, add the single color to the colors object
  colors1[colorKey] =
    Object.keys(subColors).length > 1
      ? subColors
      : subColors[Object.keys(subColors)[0]];
}

// Convert the colors object to a JSON string
let characters1 = JSON.stringify(colors1, null, 2);

// Create a new text node
let textNode1 = figma.createText();

// Load the font asynchronously before setting the characters
figma.loadFontAsync({ family: "Inter", style: "Regular" }).then(() => {
  textNode1.characters = characters1;

  // Append the text node to the current page at the viewport center
  const viewportCenter1 = figma.viewport.center;
  textNode1.x = viewportCenter1.x - textNode1.width / 2;
  textNode1.y = viewportCenter1.y - textNode1.height / 2;
  figma.currentPage.appendChild(textNode1);

  // Set the selection to the newly created text node
  figma.currentPage.selection = [textNode1];
});

//---------------------------------------------------------------------------------------------

// This function uses the Figma Plugin API to create local color variables

async function createColorVariables(collectionName = "MSAI Global Colors") {
  // Check if there are selected nodes
  if (figma.currentPage.selection.length === 0) {
    figma.closePlugin("No layers are selected.");
    return;
  }

  // for each selected node, collect the parent names in an array
  // const parentNames = figma.currentPage.selection.map(
  // (node) => node.parent.name
  // );

  // Define the variable collection
  let collection;
  let mode;

  collection = (
    await figma.variables.getLocalVariableCollectionsAsync()
  ).filter((collection) => collection.name === collectionName)[0];

  if (!collection) {
    console.log(
      `Collection ${collectionName} does not exist. Creating collection...`
    );
    collection = await figma.variables.createVariableCollection(collectionName);
  }
  // Create a variable for each selected auto layout frame
  for (const [index, node] of figma.currentPage.selection.entries()) {
    // Ensure the node is a frame
    if (node.type === "FRAME") {
    // Ensure the node is an auto layout frame
    // if ("layoutMode" in node && node.layoutMode !== "NONE") {
      // Use the name of the parent node as the mode name
      const modeName = node.parent.name;

      // Use the layer name as the variable name, appended with the index to ensure uniqueness
      const variableName = `${modeName}/${node.name}`;

      // Check if the node has a solid fill color
      if (
        node.fills &&
        node.fills.length > 0 &&
        node.fills[0].type === "SOLID"
      ) {
        // Prepare the color value
        const color = node.fills[0].color;

        // Create or update the variable
        let colorVariable;

        if (collection && collection.variables) {
          colorVariable = collection.variables.find(
            (variable) => variable.name === variableName
          );
        }

        if (!colorVariable) {
          colorVariable = figma.variables.createVariable(
            variableName,
            collection,
            "COLOR"
          );
        }

        if (collection.defaultModeId) {
          await colorVariable.setValueForMode(collection.defaultModeId, {
            r: color.r,
            g: color.g,
            b: color.b,
          });
          // name the the mode to the modeName
          // await collection.renameMode(collection.defaultModeid, modeName);
        } else {
          // Check if the mode already exists and use it as the mode if it does
          mode = collection.modes.find((mode) => mode.name === modeName);
          if (mode) {
            await colorVariable.setValueForMode(mode.modeId, {
              r: color.r,
              g: color.g,
              b: color.b,
            });
          } else {
            // Create a new mode within the collection
            mode = collection.addMode(modeName);
            if (mode) {
              await colorVariable.setValueForMode(mode.modeId, {
                r: color.r,
                g: color.g,
                b: color.b,
              });
            }
          }
        }
      }
    // }
  }
  }

  console.log("Local color variables created successfully.");
}

// Call the function to create color variables
await createColorVariables();


//---------------------------------------------------------------------------------------------


// For each selected node and its children, find the closest color variable that matches the fill or stroke color of the node and apply the variable to the respective fill or stroke of the node
const localVariables = await figma.variables.getLocalVariablesAsync();
figma.currentPage.selection.forEach(async (node) => {
  if (
    node.fills &&
    node.fills.length > 0 &&
    node.fills[0].type === "SOLID"
  ) {
    let matchingVariable = localVariables.find((variable) => {
      const color = node.fills[0].color;
      return (
        variable.valuesByMode[variable.variableCollection.modes[0].modeId]
          .r === color.r &&
        variable.valuesByMode[variable.variableCollection.modes[0].modeId]
          .g === color.g &&
        variable.valuesByMode[variable.variableCollection.modes[0].modeId]
          .b === color.b
      );
    });
    // Apply the local variable to the node
    if (matchingVariable) {
      await applyLocalVariableToNode(node, matchingVariable);
    }
  }
});


//---------------------------------------------------------------------------------------------

// For each selected node and their descendants, swap all bound variables on the node with the same variable but with a different prefix specified by the user (e.g. "Stone" to "Gray" if "Gray" was specified; all variables with the prefix "Stone" would be replaced with variables with the prefix "Gray" -- e.g. "Stone/50" would become "Gray/50")
async function swapVariablePrefixes(selectedNodes, oldPrefix, newPrefix) {
  const localVariables = await figma.variables.getLocalVariablesAsync();
  
  function swapVariables(node) {
    if (node.boundVariables) {
      console.log("here");
      for (const property in node.boundVariables) {
        if (node.boundVariables[property]) {
          node.boundVariables[property].forEach((variable) => {
            const matchingVariable = localVariables.find(
              (theVariable) =>
                theVariable.id === variable.id && theVariable.name.startsWith(oldPrefix)
            );
            if (matchingVariable) {
              const newVariable = localVariables.find(
                (theVariable) =>
                  theVariable.name ===
                  matchingVariable.name.replace(oldPrefix, newPrefix)
              );
              if (newVariable) {
                if (property === 'fills' || property === 'strokes') {
                  node[property] = node[property].map((paint) => {
                    if (paint.type === 'SOLID' && paint.variableId === matchingVariable.id) {
                      console.log(`Swapping ${matchingVariable.name} to ${newVariable.name} in ${property}`);
                      return {
                        ...paint,
                        variableId: newVariable.id
                      };
                    }
                    return paint;
                  });
                }
              }
            }
          });
        }
      }
    }
    if (node.children) {
      node.children.forEach((child) => swapVariables(child));
    }
  }

  selectedNodes.forEach((node) => swapVariables(node));
}

// Call the function to swap variable prefixes
await swapVariablePrefixes(figma.currentPage.selection, "Stone", "Gray");


//---------------------------------------------------------------------------------------------


async function removeBoundVariables() {
  figma.currentPage.selection.forEach(async node => {
    const processNode = async (node) => {
      if (node.boundVariables) {
        for (const key in node.boundVariables) {
          if (key === 'fills' || key === 'strokes') {
            const newPaints = node[key].map(paint => {
              const newPaint = {...paint};
              delete newPaint.boundVariables;
              return newPaint;
            });
            node[key] = newPaints;
          } else if (key === 'componentProperties') {
            if (node.type === "INSTANCE") {
              const mainComponent = await node.getMainComponentAsync();
              if (mainComponent) {
                const properties = mainComponent.properties;
                if (properties) {
                  for (const propertyKey in node.boundVariables[key]) {
                    properties.forEach((property) => {
                      if (property.propertyName === propertyKey) {
                        node.setComponentProperty(property.propertyName, null);
                      }
                    });
                  }
                }
              }
            }
          } else {
            // Set a new value for the property
            // This will unbind the variable, but it will also change the appearance of the node
            if (node[key] !== undefined) {
              node[key] = node[key];
            }
          }
        }
      }
      if ('children' in node && node.children) {
        for (const child of node.children) {
          await processNode(child);
        }
      }
    };
    await processNode(node);
  });
}

removeBoundVariables();


//---------------------------------------------------------------------------------------------

// For each selected text node, assign the text style that most closely matches the text style of the node based on fontName.family, fontName.style, fontSize, fontWeight, lineHeight.unit, lineHeight.value, listSpacing, paragraphIndent, paragraphSpacing, textCase, textDecoration, and letterSpacing.unit, letterSpacing.value
figma.currentPage.selection.forEach((node) => {
  if (node.type === "TEXT") {
    const textStyle = figma.getLocalTextStyles().find((textStyle) => {
      return (
        textStyle.fontName.family === node.fontName.family &&
        textStyle.fontName.style === node.fontName.style &&
        textStyle.fontSize === node.fontSize &&
        textStyle.fontWeight === node.fontWeight &&
        textStyle.lineHeight.unit === node.lineHeight.unit &&
        textStyle.lineHeight.value === node.lineHeight.value &&
        textStyle.letterSpacing.unit === node.letterSpacing.unit &&
        textStyle.letterSpacing.value === node.letterSpacing.value &&
        textStyle.textCase === node.textCase &&
        textStyle.textDecoration === node.textDecoration
      );
    });
    if (textStyle) {
      node.textStyleId = textStyle.id;
    }
  }
});
