from fastapi import APIRouter, Depends
import schemas
from auth import get_current_user
from database import get_db

router=APIRouter(prefix="/api/moves",tags=["moves"])
@router.get("",response_model=list[schemas.MoveOut])
def list_moves(db=Depends(get_db),user=Depends(get_current_user)):
    return [{k:v for k,v in d.items() if k!="_id"} for d in db.moves.find().sort("date",-1)]
