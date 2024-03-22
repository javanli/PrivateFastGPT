import { getAIApi } from '../config';
import { replaceValidChars } from '../../chat/utils';
import { VectorModelItemType } from '../../../../global/core/ai/model';
import { pipeline } from '@xenova/transformers';

export const modelOutputLen = 384;
type GetVectorProps = {
  model: VectorModelItemType;
  input: string;
};

// text to vector
export async function getVectorsByText({ model, input }: GetVectorProps) {
  if (!input) {
    return Promise.reject({
      code: 500,
      message: 'input is empty'
    });
  }

  try {
    const extractor = await pipeline('feature-extraction', 'andersonbcdefg/bge-small-4096', {
      quantized: true //使用压缩过的模型
    });
    extractor.tokenizer.model_max_length = 4096;
    const output = await extractor(input, {
      pooling: 'mean',
      normalize: true
    });
    return {
      charsLength: replaceValidChars(input).length,
      vectors: [unityDimensional(output.tolist()[0])]
    };
  } catch (error) {
    console.log(`Embedding Error`, error);

    return Promise.reject(error);
  }
}

function unityDimensional(vector: number[]) {
  if (vector.length > modelOutputLen) {
    console.log(
      `The current vector dimension is ${vector.length}, and the vector dimension cannot exceed 1536. The first 1536 dimensions are automatically captured`
    );
    return vector.slice(0, modelOutputLen);
  }
  let resultVector = vector;
  const vectorLen = vector.length;

  const zeroVector = new Array(modelOutputLen - vectorLen).fill(0);

  return resultVector.concat(zeroVector);
}
