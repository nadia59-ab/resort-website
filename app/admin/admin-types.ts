export type AdminRoomType = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  base_price: number;
  currency: string;
};

export type AdminOffer = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  room_type_ids: string[];
};
