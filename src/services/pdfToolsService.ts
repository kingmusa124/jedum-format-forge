import {mergePDFs} from 'react-native-merge-pdf';
import {PickedFile} from '@app/types/files';

export async function mergeMultiplePDFs(pdfFiles: PickedFile[], outputDir: string) {
  const filesForMerge = pdfFiles.map(file => ({
    uri: file.uri,
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  return mergePDFs({
    files: filesForMerge,
    outputPath: `${outputDir}/merged-${Date.now()}.pdf`,
  });
}
