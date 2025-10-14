import User from "./User";
import Client from "./Client";
import Student from "./Student";

const models = { User, Client, Student };

export const initializeAssociations = () => {
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });
};

export default models;
