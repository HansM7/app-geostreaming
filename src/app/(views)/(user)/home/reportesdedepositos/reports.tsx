"use client";
import React, { useEffect, useState } from "react";

import Table from "@/app/components/common/table";
import NoRecords from "@/app/components/common/noRecords";
import axios from "axios";
import { useSession } from "next-auth/react";
import { IoMdClose } from "react-icons/io";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const Reports = () => {
  const session = useSession();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString?: string): string => {
    if (!dateString) {
      return "Sin fecha";
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Fecha inválida";
    }

    return format(date, "PPPp", { locale: es });
  };

  const columns = [
    { Header: "ID", accessor: "id" },
    { Header: "Numero de comprobante", accessor: "number" },
    { Header: "Fecha y hora", accessor: (row: any) => formatDate(row.date) },
    { Header: "Monto (centavos)", accessor: "value" },
    {
      Header: "Comprobante",
      accessor: (row: any) => (
        <img
          className="w-[100px] h-[100px]  object-cover cursor-pointer hover:shadow-lg rounded-md"
          src={`/vouchers/vouchers_${row.id}.png`}
          alt={`comprobante N: ${row.id}`}
          onClick={() => handleImageClick(row.id)}
        />
      ),
    },
  ];

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/voucher");
      const filteredVoucher = response.data.filter((voucher: any) => {
        return voucher.user_id === Number(session.data?.user.id);
      });
      setVouchers(filteredVoucher);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageClick = (voucherId: number) => {
    setSelectedImage(`/vouchers/vouchers_${voucherId}.png`);
  };

  return (
    <>
      {vouchers.length === 0 ? (
        <NoRecords title="depósitos" />
      ) : (
        <Table
          columns={columns}
          data={vouchers}
          showActions={false}
          title="Historial de depósitos"
          download={true}
        />
      )}
      {selectedImage && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <img
            src={selectedImage}
            alt="Ampliación de comprobante"
            className="max-w-[90%] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <IoMdClose className="text-3xl" />
          </button>
        </div>
      )}
    </>
  );
};

export default Reports;
