import type {
  BaseSchema,
  BaseSchemaAsync,
  Issues,
  Output,
} from '../../types.ts';
import { getSchemaIssues } from '../../utils/index.ts';

/**
 * Intersection options async type.
 */
export type IntersectionOptionsAsync = [
  BaseSchema | BaseSchemaAsync,
  BaseSchema | BaseSchemaAsync,
  ...(BaseSchema[] | BaseSchemaAsync[])
];

type AsyncIntersectionInput<
  TIntersectionOptions extends IntersectionOptionsAsync
> = TIntersectionOptions extends [
  BaseSchema<infer TInput, any>,
  ...infer TRest
]
  ? TRest extends IntersectionOptionsAsync
    ? TInput & AsyncIntersectionOutput<TRest>
    : TRest extends [BaseSchema<infer TInput2, any>]
    ? TInput & TInput2
    : TRest extends [BaseSchemaAsync<infer TInput2, any>]
    ? TInput & TInput2
    : never
  : TIntersectionOptions extends [
      BaseSchemaAsync<infer TInput, any>,
      ...infer TRest
    ]
  ? TRest extends IntersectionOptionsAsync
    ? TInput & AsyncIntersectionOutput<TRest>
    : TRest extends [BaseSchema<infer TInput2, any>]
    ? TInput & TInput2
    : TRest extends [BaseSchemaAsync<infer TInput2, any>]
    ? TInput & TInput2
    : never
  : never;

type AsyncIntersectionOutput<
  TIntersectionOptions extends IntersectionOptionsAsync
> = TIntersectionOptions extends [
  BaseSchema<any, infer TOutput>,
  ...infer TRest
]
  ? TRest extends IntersectionOptionsAsync
    ? TOutput & AsyncIntersectionOutput<TRest>
    : TRest extends [BaseSchema<any, infer TOutput2>]
    ? TOutput & TOutput2
    : TRest extends [BaseSchemaAsync<any, infer TOutput2>]
    ? TOutput & TOutput2
    : never
  : TIntersectionOptions extends [
      BaseSchemaAsync<any, infer TOutput>,
      ...infer TRest
    ]
  ? TRest extends IntersectionOptionsAsync
    ? TOutput & AsyncIntersectionOutput<TRest>
    : TRest extends [BaseSchema<any, infer TOutput2>]
    ? TOutput & TOutput2
    : TRest extends [BaseSchemaAsync<any, infer TOutput2>]
    ? TOutput & TOutput2
    : never
  : never;

/**
 * Intersection schema async type.
 */
export type IntersectionSchemaAsync<
  TIntersectionOptions extends IntersectionOptionsAsync,
  TOutput = AsyncIntersectionOutput<TIntersectionOptions>
> = BaseSchemaAsync<
  AsyncIntersectionInput<TIntersectionOptions>, TOutput
> & {
  schema: 'intersection';
  intersection: TIntersectionOptions;
};

/**
 * Creates an async intersection schema.
 *
 * @param intersection The intersection schema.
 * @param error The error message.
 *
 * @returns An async intersection schema.
 */
export function intersectionAsync<
  TIntersectionOptions extends IntersectionOptionsAsync
>(
  intersection: TIntersectionOptions,
  error?: string
): IntersectionSchemaAsync<TIntersectionOptions> {
  return {
    /**
     * The schema type.
     */
    schema: 'intersection',

    /**
     * The intersection schema.
     */
    intersection,

    /**
     * Whether it's async.
     */
    async: true,

    /**
     * Parses unknown input based on its schema.
     *
     * @param input The input to be parsed.
     * @param info The parse info.
     *
     * @returns The parsed output.
     */
    async _parse(input, info) {
      // Create issues and output
      let issues: Issues | undefined;
      let output: [Output<TIntersectionOptions[number]>] | undefined;

      // Parse schema of each option
      for (const schema of intersection) {
        const result = await schema._parse(input, info);

        // If there are issues, set output and break loop
        if (result.issues) {
          issues = result.issues;
          // collect deeply nested issues
          while (issues?.length) {
            issues =
              (issues => (issues.length ? (issues as Issues) : undefined))(issues.flatMap(i => i.issues ?? [])) ??
              issues
            break
          }
          break;
        } else {
          if (output) {
            output.push(result.output);
          } else {
            output = [result.output];
          }
        }
      }

      // Return input as output or issues
      return !issues && output
        ? {
            output: output.reduce((acc, value) => {
              if (typeof value === 'object') {
                return { ...acc, ...value };
              }
              return value;
            }) as AsyncIntersectionOutput<TIntersectionOptions>,
          }
        : getSchemaIssues(
          info,
          'type',
          'intersection',
          error || 'Invalid type',
          input,
          issues
        );
    },
  };
}
