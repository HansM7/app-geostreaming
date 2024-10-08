"use client";
import { useEffect, useState } from "react";
import Table from "@/app/components/common/table";
import Modal from "@/app/components/common/modal";
import BankForm from "./bankForm";
import { SubmitHandler } from "react-hook-form";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Inputs = {
  id?: number;
  bank?: string;
  number?: string;
  name?: string;
  type?: string;
  bank_url?: string;
};
const Bank = () => {
  const [banks, setBanks] = useState<Inputs[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<Inputs | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const fetchBanks = async () => {
    try {
      const response = await axios.get("/api/bank");
      const descendingBank = response.data.sort((a:any, b:any) => b.id - a.id);
      setBanks(descendingBank);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };
  useEffect(() => {
    fetchBanks();
  }, []);

  const handleSaveBank: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
   
    try {
      if (data.id) {
        await axios.patch(`/api/bank/${data.id}`, {
          bank_url: data.bank_url,
          bank: data.bank,
          number: data.number,
          name: data.name,
          type: data.type,
        });
        toast.success("Se actualizo correctamente");
      } else {
        await axios.post("/api/bank", {
          bank_url: data.bank_url,
          bank: data.bank,
          number: data.number,
          name: data.name,
          type: data.type,
        });
        toast.success("Se guardo correctamente");
      }
        fetchBanks();

      closeModal();
    } catch (error) {
      console.error("Error al guardar el registro:", error);
      toast.error("Hubo un error al guardar el registro");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { Header: "ID", accessor: "id" },
    { Header: "Imagen",accessor: (row: Inputs) => (
      <img
        className="w-10 h-10 object-cover aspect-square rounded-full"
        src={row.bank_url}
        alt={row.bank}
      />
    ),},
    { Header: "Banco", accessor: "bank" },
    { Header: "Número", accessor: "number" },
    { Header: "Nombre", accessor: "name" },
    { Header: "Tipo", accessor: "type" },
  ];

  const handleEdit = async (record: Inputs) => {
    try {
      const response = await axios.get(`/api/bank/${record.id}`);
      setSelectedRecord(response.data);
      setModalTitle("Editar banco");
      setIsModalOpen(true);

    } catch (error) {
   
      toast.error("Error al obtener los datos");
    }
  };

  const handleAdd = () => {
    setSelectedRecord(null);
    setModalTitle("Agregar banco");
    setIsModalOpen(true);
  };

  const handleDelete = (record: Inputs) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/bank/${selectedRecord?.id}`);
      toast.success("Registro eliminado correctamente");
      fetchBanks();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
      toast.error("Hubo un error al eliminar el registro");
    }
  };

  return (
    <div>
      <Table
        columns={columns}
        data={banks}
        showActions={true}
        addRecord={true}
        title="Bancos"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle}>
        <BankForm
          defaultValues={selectedRecord || {}}
          onSubmit={handleSaveBank}
        />
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div>
          <p>¿Está seguro(a) de que quiere eliminar este banco?</p>
          <button
            onClick={handleDeleteConfirm}
            className="bg-red-500 text-white mt-4 px-4 py-1 rounded"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Bank;
