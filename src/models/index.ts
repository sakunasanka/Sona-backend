import User from "./User";
import Client from "./Client";
import Student from "./Student";
import Notification from "./Notification";

const models = { User, Client, Student, Notification };

export const initializeAssociations = () => {
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });
};

export default models;
