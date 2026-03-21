import RNFS from 'react-native-fs';

export async function extractPresentationText(inputPath: string, outputDir: string) {
  const extension = inputPath.toLowerCase().endsWith('.pptx') ? 'pptx' : 'ppt';
  const outputPath = `${outputDir}/presentation-text-${Date.now()}.txt`;
  const message =
    extension === 'pptx'
      ? 'PowerPoint text extraction is limited on-device. For full fidelity conversion, use the secure server option.'
      : 'Legacy PPT parsing is limited on-device. For full fidelity conversion, use the secure server option.';
  await RNFS.writeFile(outputPath, message, 'utf8');
  return outputPath;
}
