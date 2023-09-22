export const onRequestPost = async (context) => {
    // console.log("get_aircraft.js onRequestGet context: ", context);
    const icao24 = await context.request.json();
    // const icao24 = context.params.icao24;
    // console.log("icao24", icao24);
  
    const d1_response = await context.env.SKYCHECK_DB.prepare("SELECT * FROM aircraft WHERE icao24 = ?").bind(icao24).run();

    let response = null;
    if (d1_response.meta.rows_read === 0) {
      response = new Response(`Failed to get aircraft info for ${icao24}: ` + JSON.stringify(d1_response), { status: 500 });
    } else {
        const manufacturername = d1_response.results[0].manufacturername;
        const model = d1_response.results[0].model;
        const responseMessage = { manufacturername: manufacturername, model: model};
        response = new Response(JSON.stringify(responseMessage), { status: 200 });
    }
    return response;  
    
  };