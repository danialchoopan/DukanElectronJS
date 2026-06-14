declare global {
  interface Window {
    api: {
      auth: {
        login: (pinCode: string) => Promise<{ success: boolean; user?: any; error?: string }>;
        listUsers: () => Promise<any[]>;
        createUser: (data: { name: string; pinCode: string; role: string }) => Promise<any>;
        deleteUser: (id: number) => Promise<any>;
        changePin: (id: number, newPin: string) => Promise<any>;
      };
      products: {
        list: (search?: string) => Promise<any[]>;
        getByBarcode: (barcode: string) => Promise<any>;
        getById: (id: number) => Promise<any>;
        create: (product: any) => Promise<any>;
        update: (product: any) => Promise<any>;
        delete: (id: number) => Promise<any>;
        getLoose: () => Promise<any[]>;
        decrementStock: (items: any[]) => Promise<any>;
        restock: (id: number, quantity: number) => Promise<any>;
      };
      sales: {
        create: (data: any) => Promise<any>;
        list: (filters?: any) => Promise<any[]>;
        getItems: (saleId: number) => Promise<any[]>;
        summary: (filters?: any) => Promise<any>;
        userPerformance: (filters?: any) => Promise<any[]>;
      };
      suspend: {
        save: (userId: number, items: any[]) => Promise<any>;
        list: (userId: number) => Promise<any[]>;
        load: (id: number) => Promise<any>;
        delete: (id: number) => Promise<any>;
      };
      config: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<any>;
      };
      window: {
        minimize: () => void;
        close: () => void;
      };
    };
  }
}

export {};
