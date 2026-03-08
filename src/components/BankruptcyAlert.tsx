interface Props {
  message: string;
}

export default function BankruptcyAlert({ message }: Props) {
  return (
    <div className="bankruptcy-alert">
      {message}
    </div>
  );
}
