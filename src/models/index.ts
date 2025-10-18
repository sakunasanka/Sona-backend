import User from "./User";
import Client from "./Client";
import Student from "./Student";
import Review from "./Review";

const models = { User, Client, Student, Review };

export const initializeAssociations = () => {
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });
};

export default models;
