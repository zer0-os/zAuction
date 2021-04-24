import React, {createContext, useEffect, useState} from 'react';

export const UserContext = createContext(null);

export const UserContextProvider = (props: { children: React.ReactNode; }) => {
  const [user, setUser] = useState("yams");

  const loaded = async () => {
    setUser("smay");
  }

  useEffect(() => {
    loaded();
  }, [])

  return (
        <UserContext.Provider value={user}>
          {props.children}
        </UserContext.Provider>
  )
}

export default UserContextProvider;