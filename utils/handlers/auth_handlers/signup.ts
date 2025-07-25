import { account, client, db } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { userDataType } from "@/types/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "@/constants/env";

export async function handleSignUp(data: userDataType): Promise<string | null> {
  const {password, ...rest} = data;
  try {
    const id = ID.unique();
    const accountResponse = await account.create(id, data.email, password!);
    const appwriteUserId = accountResponse.$id;

    await account.createEmailPasswordSession(data.email, password!);

    const jwt = await account.createJWT();
    await AsyncStorage.setItem("appwrite_jwt", jwt.jwt);
    client.setJWT(jwt.jwt);

    const session = await account.get(); 
    console.log("Authenticated user:", session);

    await db.createDocument(
      ENV.DB_ID,
      ENV.DB_USERS_COL_ID,
      appwriteUserId,
      {
        ...rest,
        postIndex: data.postIndex.toString(),
        role: "user",
        ID: appwriteUserId,
        cartItems: [],
        orders: [],
      }
    );
    return null;
  } catch (err: any) {
    console.log(err);
    return err instanceof Error ? err.message : "An error occurred during signup";
  }
}