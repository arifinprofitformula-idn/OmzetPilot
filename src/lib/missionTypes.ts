export type MissionType = "follow_up" | "offer" | "content_traffic";

export type MissionGenerationItem = {
  mission_type: MissionType;
  mission_order: 1 | 2 | 3;
  target_description: string;
  action_instruction: string;
  script_text: string;
  target_minimum: string;
};

export type MissionGenerationInput = {
  missionDate: string;
  userId: string;
  userFullName: string;
  businessName: string;
  businessSegment: string;
  targetCustomer: string;
  productName: string;
  productDescription: string | null;
  productPrice: number | null;
  currentOffer: string | null;
  mainSalesChannel: string;
  mainSalesProblem: string;
  hasCustomerDatabase: string;
  contactEstimate: string;
};
