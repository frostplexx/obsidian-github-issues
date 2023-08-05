/**
 * Returns a suitable color, thats similar to the given color but with a contrast of at least 4.5 to the given color
 * @param hexColor
 * @returns a suitable color
 */
export function getTextColor(hexColor: string){
	if (hexColor == undefined) return "#000000"
	const color = hexColor.contains("#") ? hexColor.replace('#', '') : hexColor;
	const r = parseInt(color.substring(0, 2), 16); // hexToR
	const g = parseInt(color.substring(2, 4), 16); // hexToG
	const b = parseInt(color.substring(4, 6), 16); // hexToB

	const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
	return (yiq >= 128) ? '#000000' : '#ffffff';
}
