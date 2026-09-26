import enum


class ReceiptStatus(str, enum.Enum):
    Draft = "Draft"
    Ready = "Ready"
    Done = "Done"
    Canceled = "Canceled"


class DeliveryStatus(str, enum.Enum):
    Draft = "Draft"
    Waiting = "Waiting"
    Ready = "Ready"
    Done = "Done"
    Canceled = "Canceled"
