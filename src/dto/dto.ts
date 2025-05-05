export type PartialDto<T> = {
    [P in keyof T]?: T[P];
}