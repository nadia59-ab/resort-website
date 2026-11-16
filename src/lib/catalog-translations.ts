const TRANSLATION_COLUMNS = ["name_ru", "name_de", "description_ru", "description_de"];
type TranslationFields = {
  name_ru: string | null;
  name_de: string | null;
  description_ru: string | null;
  description_de: string | null;
};

export function isMissingTranslationColumns(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return TRANSLATION_COLUMNS.some((column) => message.includes(column));
}

export function addEmptyTranslations<T>(rows: T[]): (T & TranslationFields)[] {
  return rows.map((row) => {
    const values = row as unknown as {
      name_ru?: string | null;
      name_de?: string | null;
      description_ru?: string | null;
      description_de?: string | null;
    };
    return {
      ...row,
      name_ru: values.name_ru ?? null,
      name_de: values.name_de ?? null,
      description_ru: values.description_ru ?? null,
      description_de: values.description_de ?? null,
    } as T & TranslationFields;
  });
}
