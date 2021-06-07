const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let choiced_country;

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot(xParam, yParam, rParam);
        updateBarChart(param);
        
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot(xParam, yParam, rParam);
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBarChart(param);
    });
    
    function updateScatterPlot(x_axis, y_axis, r_axis){
        scatterPlot.selectAll("g").remove();

        var min_max_x = [d3.min(data, d => +d[x_axis][year]), d3.max(data, d => +d[x_axis][year])] 
        var xAxis = d3.scaleLinear()
        .range([margin*2, width-margin])
        .domain(min_max_x);
        scatterPlot.append('g')
        .attr('transform', `translate(0, ${height-margin})`)
        .call(d3.axisBottom(xAxis));

        var min_max_y = [d3.min(data, d => +d[y_axis][year]), d3.max(data, d => +d[y_axis][year])] 
        var yAxis   = d3.scaleLinear()
        .range([height-margin, margin])
        .domain(min_max_y);
        scatterPlot.append('g')
        .attr('transform', `translate(${margin*2}, 0)`)
        .call(d3.axisLeft(yAxis));
        
        var min_max_r = [d3.min(data, d => +d[r_axis][year]), d3.max(data, d => +d[r_axis][year])] 
        var radiusScale = d3.scaleSqrt()
        .range([10, 30])
        .domain(min_max_r);
        
        scatterPlot
        .append('g')
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => (d[x_axis]) ? xAxis(+d[x_axis][year]) : xAxis(0))
        .attr("cy", d => (d[y_axis]) ? yAxis(+d[y_axis][year]) : yAxis(0))
        .attr("r", d => (d[r_axis]) ? radiusScale(+d[r_axis][year]) : radiusScale(0))
        .attr("fill", d => colorScale(d.region))
        .on('click', function (param_click) {
            choiced_country = param_click.country
            console.log(choiced_country)
            countryName.html(choiced_country);
            
            updateLinearPlot(param);

            scatterPlot
            .selectAll("circle")
            .attr("stroke", 'black')
            .attr("stroke-width", d => d.country === choiced_country ? 1.0: .0);


        });
    }

    function updateBarChart(p){
        barChart.selectAll("g").remove()
        
        regs = ['africa', 'asia', 'europe', 'americas']

        var xBarAxis = d3.scaleBand()
        .range([margin*2, barWidth-margin])
        .domain(regs)
        .padding(0.1);
        barChart.append('g')
        .attr('transform', `translate(0, ${height-margin})`)
        .call(d3.axisBottom(xBarAxis))
        
        var min_max_y = [d3.min(data, d => +d[p][year]), d3.max(data, d => +d[p][year])] 
        var yBarAxis = d3.scaleLinear()
        .range([height-margin, margin])
        .domain(min_max_y);
        barChart.append('g')
        .attr('transform', `translate(${margin*2}, 0)`)
        .call(d3.axisLeft(yBarAxis))

        data_regs = []
        
        for (reg of regs)
        {
            data_regs.push({'reg': reg, 
            'value': d3.mean(data, function (d) { if (reg == d.region) return +d[p][year]})})
        }
        barChart.append('g')
        .selectAll(".bar")
        .data(data_regs)
        .enter()
        .append("rect")
        .attr("x", d => xBarAxis(d.reg))
        .attr("y", d => yBarAxis(d.value)) 
        .style("fill", d => colorScale(d.reg) )
        .attr("width", xBarAxis.bandwidth())
        .attr("height", d => height - yBarAxis(d.value) - margin) 
        .on('click', function (param_click) {
            console.log(param_click.reg)
            choiced_reg = param_click.reg
            barChart.selectAll('rect')
            .style('opacity', d => d.reg === choiced_reg ? 1.0: .2);
            
            scatterPlot
            .selectAll("circle")
            .style('opacity', d => d.region === choiced_reg ? 1.0: 0);
        })
        
        
    }

    function updateLinearPlot(p){
        lineChart.selectAll('g, path').remove();
        
        var country_cur = data.findIndex(d => d.country === choiced_country)
        var xData = Object.keys(data[country_cur][p]).map(d => +d).slice(0, -5);
        var yData = Object.values(data[country_cur][p]).map(d => +d).slice(0, -5);
        
        var min_max_x = [d3.min(xData, d => d), d3.max(xData, d => d)]
        console.log(xData)
        var xLineAxis = d3.scaleLinear()
        .range([margin*2, width-margin])
        .domain(min_max_x);
        lineChart.append('g')
        .attr('transform', `translate(0, ${height-margin})`)
        .call(d3.axisBottom(xLineAxis));
        
        var min_max_y = [d3.min(yData), d3.max(yData)]
        console.log(min_max_y)
        var yLineAxis = d3.scaleLinear()
        .range([height-margin, margin])
        .domain(min_max_y);
        lineChart.append('g')
        .attr('transform', `translate(${margin*2}, 0)`)
        .call(d3.axisLeft(yLineAxis));
        
        data_LP = []
    
        for (i of Array(xData.length).keys())
        {
            data_LP.push({'x': xData[i], 'y': yData[i]})
        }

        lineChart.append("path")
        .datum(data_LP)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x(d => xLineAxis(d.x))
        .y(d => yLineAxis(d.y))
        )
        
    }
    
    
    updateScatterPlot(xParam, yParam, rParam);
    updateBarChart(param);
    updateLinearPlot(param);
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}
